# Keycloak on Oracle Cloud (Always Free)

OpenTofu creates everything Keycloak needs in Oracle Cloud's Always Free tier:

- A network with a public subnet for the server and a private subnet for the database.
- An Ampere A1 Ubuntu 24.04 server (2 OCPU, 12 GB) with a reserved public IP.
- A managed MySQL HeatWave database (`MySQL.Free`), reachable only from the server.
- A $1 monthly budget that emails you as soon as anything costs money.

The Keycloak server runs the Docker Compose stack in `keycloak/`, with Keycloak behind Caddy for automatic HTTPS.

## What keeps itself running

| Area | Handled by | Schedule |
|---|---|---|
| Ubuntu security patches and Docker engine updates | unattended-upgrades, rebooting when needed | Daily, reboot at 04:00 |
| Keycloak patch releases (`26.7.x`) and Caddy updates | `keycloak-update.timer` on the server | Sundays around 05:00 |
| HTTPS certificate renewal | Caddy | Automatic |
| MySQL patches, upgrades and daily backups (kept 7 days) | Oracle | Oracle's maintenance window |
| Surprise charges | Budget alert email | As soon as anything is billed |

**What you still do by hand (rarely):**

- **Keycloak minor upgrade:** change `26.7` in `keycloak/Dockerfile` after reading the release notes.
- **Ubuntu release upgrade:** 24.04 is supported until 2029.
- **Rotating secrets.**

Oracle emails `alert_email` about a week before each MySQL maintenance run.

## 1. Oracle account

1. Sign up at oracle.com/cloud/free. The **home region is permanent**, and Always Free resources exist only there. Pick one close to your users.
2. **Recommended: upgrade to Pay As You Go.** Always Free resources stay free after upgrading. Oracle may reclaim free-tier server instances that sit mostly idle for 7 days, and an idle login server looks exactly like that; upgraded accounts are not subject to this. The budget alert tells you if anything ever costs money.

## 2. Local tools and API key

```bash
brew install opentofu oci-cli
oci setup config
```

The `oci setup config` command asks for:

- **User OCID and tenancy OCID:** from the console under Profile → My profile, and Profile → Tenancy.
- **Region.**

It then generates an API key. Upload the public key it prints (`~/.oci/oci_api_key_public.pem`) under Profile → My profile → API keys → Add API key.

## 3. Create the infrastructure

```bash
cd infra/oci
cp terraform.tfvars.example terraform.tfvars   # fill in the four values
tofu init
tofu apply
```

The database takes 10–20 minutes to create.

**"Out of host capacity"** means Oracle has no free A1 capacity right now. Either retry until it succeeds:

```bash
until tofu apply -auto-approve; do echo "No capacity, retrying in 5 minutes"; sleep 300; done
```

Or, in regions with several availability domains, set `availability_domain_index = 1` (or `2`).

**The state file (`terraform.tfstate`) contains the database passwords.** It is gitignored. Keep a copy in a password manager. If it is lost the resources keep running, but OpenTofu forgets it manages them.

## 4. DNS

Create an `A` record for `auth.dourak.app` pointing at:

```bash
tofu output -raw public_ip
```

## 5. Create the Keycloak database and user

Wait for the server's first-boot setup to finish, then create the database through it. MySQL only accepts connections from inside the network.

```bash
IP=$(tofu output -raw public_ip)
ssh ubuntu@$IP cloud-init status --wait

ssh ubuntu@$IP "MYSQL_PWD='$(tofu output -raw mysql_admin_password)' \
  mysql -h $(tofu output -raw mysql_private_ip) -u dbadmin --ssl-mode=REQUIRED" <<SQL
CREATE DATABASE keycloak CHARACTER SET utf8mb4;
CREATE USER 'keycloak'@'%' IDENTIFIED BY '$(tofu output -raw keycloak_db_password)';
GRANT ALL PRIVILEGES ON keycloak.* TO 'keycloak'@'%';
SQL
```

## 6. Deploy Keycloak

From the repo root:

```bash
cp keycloak/.env.example keycloak/.env
```

Fill in every value in `keycloak/.env`:

- **`KC_DB_URL`:** `tofu -chdir=infra/oci output -raw kc_db_url`
- **`KC_DB_PASSWORD`:** `tofu -chdir=infra/oci output -raw keycloak_db_password`
- **`KC_DOURAK_CLIENT_SECRET`:** generate with `openssl rand -hex 32`. It must match `KEYCLOAK_CLIENT_SECRET` in Vercel.
- **The rest:** Google and Resend credentials, the bootstrap admin, and `DOURAK_APP_URL=https://dourak.app`.

Then copy the folder to the server and start it:

```bash
IP=$(tofu -chdir=infra/oci output -raw public_ip)
rsync -av keycloak/ ubuntu@$IP:~/keycloak/
ssh ubuntu@$IP 'chmod 600 ~/keycloak/.env && cd ~/keycloak && docker compose up -d --build'
```

Caddy gets the HTTPS certificate once DNS resolves. The admin console is at `https://auth.dourak.app`. After first sign-in, create a permanent admin user and delete the bootstrap one.

## 7. Connect the app

1. In the Google OAuth client used for sign-in, add the redirect URI `https://auth.dourak.app/realms/dourak/broker/google/endpoint`.
2. In Vercel, set:
   - `KEYCLOAK_ISSUER=https://auth.dourak.app/realms/dourak`
   - `KEYCLOAK_CLIENT_ID=dourak`
   - `KEYCLOAK_CLIENT_SECRET`
3. Delete the old `ZITADEL_*` variables in Vercel, then redeploy.

## Changing Keycloak later

- **Realm files** in `keycloak/realms/` are imported only when a realm does not exist yet. Change existing realms in the admin console.
- **Another project:** add `keycloak/realms/<name>-realm.json`, rsync, and run `docker compose up -d --build`.
- **Config changes:** edit locally, rsync, then run `docker compose up -d --build` on the server.

## Recovery

- **Server lost or reclaimed:** run `tofu apply` again. The reserved IP is reattached, so DNS keeps working. Then repeat step 6.
- **Database broken:** restore a backup from the console (MySQL → DB systems → Backups). The realm config is also in git. Google users are matched to their existing app accounts by verified email when they next sign in, so only password users would need to reset their password.
- **Tear everything down:** set `is_delete_protected = false` in `main.tf`, run `tofu apply`, then run `tofu destroy`.

## Troubleshooting

- **Site unreachable:** check both firewalls.
  - **Oracle security list:** managed by OpenTofu.
  - **Server iptables:** check with `sudo iptables -L INPUT -n --line-numbers`. It should list an ACCEPT rule for ports 80 and 443 above the REJECT rule.
- **No certificate:** check that `dig auth.dourak.app` returns the public IP, then run `docker compose logs caddy`.
- **Keycloak not starting:** run `docker compose logs -f keycloak`. For database errors, test the connection from the server with `mysql -h <mysql_private_ip> -u keycloak -p --ssl-mode=REQUIRED`.
- **Weekly update status:** `systemctl list-timers keycloak-update.timer` and `journalctl -u keycloak-update`.
