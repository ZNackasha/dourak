locals {
  compartment_id = coalesce(var.compartment_ocid, var.tenancy_ocid)
  vcn_cidr       = "10.0.0.0/16"
  public_cidr    = "10.0.0.0/24"
  private_cidr   = "10.0.1.0/24"
  vm_shape       = "VM.Standard.A1.Flex"
  ad             = data.oci_identity_availability_domains.all.availability_domains[var.availability_domain_index].name
}

data "oci_identity_availability_domains" "all" {
  compartment_id = var.tenancy_ocid
}

data "oci_core_images" "ubuntu" {
  compartment_id           = local.compartment_id
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = local.vm_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# --- Network ---------------------------------------------------------------

resource "oci_core_vcn" "main" {
  compartment_id = local.compartment_id
  cidr_blocks    = [local.vcn_cidr]
  display_name   = "keycloak"
  dns_label      = "keycloak"
}

resource "oci_core_internet_gateway" "main" {
  compartment_id = local.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "keycloak"
}

resource "oci_core_route_table" "public" {
  compartment_id = local.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "public"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.main.id
  }
}

resource "oci_core_security_list" "public" {
  compartment_id = local.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "public"

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  ingress_security_rules {
    protocol = "6"
    source   = var.ssh_allowed_cidr
    tcp_options {
      min = 22
      max = 22
    }
  }

  dynamic "ingress_security_rules" {
    for_each = [80, 443]
    content {
      protocol = "6"
      source   = "0.0.0.0/0"
      tcp_options {
        min = ingress_security_rules.value
        max = ingress_security_rules.value
      }
    }
  }

  # Path MTU discovery; without it large TLS responses can stall.
  ingress_security_rules {
    protocol = "1"
    source   = "0.0.0.0/0"
    icmp_options {
      type = 3
      code = 4
    }
  }
}

resource "oci_core_security_list" "private" {
  compartment_id = local.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "private"

  ingress_security_rules {
    protocol = "6"
    source   = local.public_cidr
    tcp_options {
      min = 3306
      max = 3306
    }
  }
}

resource "oci_core_subnet" "public" {
  compartment_id    = local.compartment_id
  vcn_id            = oci_core_vcn.main.id
  cidr_block        = local.public_cidr
  display_name      = "public"
  dns_label         = "public"
  route_table_id    = oci_core_route_table.public.id
  security_list_ids = [oci_core_security_list.public.id]
}

resource "oci_core_subnet" "private" {
  compartment_id             = local.compartment_id
  vcn_id                     = oci_core_vcn.main.id
  cidr_block                 = local.private_cidr
  display_name               = "private"
  dns_label                  = "private"
  prohibit_public_ip_on_vnic = true
  security_list_ids          = [oci_core_security_list.private.id]
}

# --- Keycloak VM -----------------------------------------------------------

resource "oci_core_instance" "keycloak" {
  availability_domain = local.ad
  compartment_id      = local.compartment_id
  display_name        = "keycloak"
  shape               = local.vm_shape

  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory_gbs
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu.images[0].id
    boot_volume_size_in_gbs = var.boot_volume_gbs
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.public.id
    assign_public_ip = false
    hostname_label   = "keycloak"
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(file("${path.module}/cloud-init.yaml"))
  }

  lifecycle {
    # A newer Ubuntu image or an edited cloud-init would otherwise replace the running server.
    ignore_changes = [source_details[0].source_id, metadata["user_data"]]
  }
}

data "oci_core_vnic_attachments" "keycloak" {
  compartment_id = local.compartment_id
  instance_id    = oci_core_instance.keycloak.id
}

data "oci_core_private_ips" "keycloak" {
  vnic_id = data.oci_core_vnic_attachments.keycloak.vnic_attachments[0].vnic_id
}

# Reserved so the DNS record survives the VM being rebuilt.
resource "oci_core_public_ip" "keycloak" {
  compartment_id = local.compartment_id
  lifetime       = "RESERVED"
  display_name   = "keycloak"
  private_ip_id  = data.oci_core_private_ips.keycloak.private_ips[0].id
}

# --- MySQL HeatWave (Always Free) ------------------------------------------

resource "random_password" "mysql_admin" {
  length           = 24
  min_upper        = 2
  min_lower        = 2
  min_numeric      = 2
  min_special      = 2
  override_special = "%*-_=+"
}

resource "random_password" "keycloak_db" {
  length           = 32
  min_upper        = 2
  min_lower        = 2
  min_numeric      = 2
  min_special      = 2
  override_special = "%*-_=+"
}

resource "oci_mysql_mysql_db_system" "keycloak" {
  availability_domain     = local.ad
  compartment_id          = local.compartment_id
  display_name            = "keycloak"
  shape_name              = "MySQL.Free"
  subnet_id               = oci_core_subnet.private.id
  hostname_label          = "mysql"
  admin_username          = "dbadmin"
  admin_password          = random_password.mysql_admin.result
  data_storage_size_in_gb = 50
  is_highly_available     = false

  # Always Free systems reject a custom backup_policy; Oracle applies its own.
  deletion_policy {
    is_delete_protected = true
  }

  customer_contacts {
    email = var.alert_email
  }

  lifecycle {
    # Oracle upgrades Always Free systems itself; never let a version diff replace the database.
    ignore_changes = [mysql_version]
  }
}

# --- Spend guard -----------------------------------------------------------

resource "oci_budget_budget" "free_tier_guard" {
  compartment_id = var.tenancy_ocid
  amount         = 1
  reset_period   = "MONTHLY"
  target_type    = "COMPARTMENT"
  targets        = [var.tenancy_ocid]
  display_name   = "free-tier-guard"
}

resource "oci_budget_alert_rule" "any_spend" {
  budget_id      = oci_budget_budget.free_tier_guard.id
  display_name   = "any-spend"
  type           = "ACTUAL"
  threshold_type = "PERCENTAGE"
  threshold      = 1
  recipients     = var.alert_email
  message        = "Oracle Cloud is billing this tenancy: something is outside the Always Free limits."
}
