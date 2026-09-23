output "public_ip" {
  description = "Point the Keycloak hostname's DNS A record here."
  value       = oci_core_public_ip.keycloak.ip_address
}

output "ssh" {
  value = "ssh ubuntu@${oci_core_public_ip.keycloak.ip_address}"
}

output "mysql_private_ip" {
  value = oci_mysql_mysql_db_system.keycloak.ip_address
}

output "kc_db_url" {
  description = "KC_DB_URL for keycloak/.env."
  value       = "jdbc:mysql://${oci_mysql_mysql_db_system.keycloak.ip_address}:3306/keycloak?sslMode=REQUIRED"
}

output "mysql_admin_username" {
  value = oci_mysql_mysql_db_system.keycloak.admin_username
}

output "mysql_admin_password" {
  value     = random_password.mysql_admin.result
  sensitive = true
}

output "keycloak_db_password" {
  description = "KC_DB_PASSWORD for keycloak/.env; also used when creating the MySQL user."
  value       = random_password.keycloak_db.result
  sensitive   = true
}
