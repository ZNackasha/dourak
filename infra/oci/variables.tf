variable "tenancy_ocid" {
  description = "Tenancy OCID (Profile menu > Tenancy)."
  type        = string
}

variable "region" {
  description = "Home region identifier, e.g. us-ashburn-1. Always Free resources only exist there."
  type        = string
}

variable "oci_config_profile" {
  description = "Profile in ~/.oci/config holding the API key."
  type        = string
  default     = "DEFAULT"
}

variable "compartment_ocid" {
  description = "Compartment for all resources. Defaults to the tenancy root."
  type        = string
  default     = null
}

variable "ssh_public_key" {
  description = "Public key allowed to SSH in as the ubuntu user."
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "Source range allowed to reach SSH. Narrow this to your own IP if it is static."
  type        = string
  default     = "0.0.0.0/0"
}

variable "alert_email" {
  description = "Receives spend alerts and Oracle's MySQL maintenance notices."
  type        = string
}

variable "availability_domain_index" {
  description = "Try another index if the A1 shape reports 'Out of host capacity'."
  type        = number
  default     = 0
}

variable "instance_ocpus" {
  description = "A1 OCPUs; the Always Free allowance is 2 in total."
  type        = number
  default     = 2
}

variable "instance_memory_gbs" {
  description = "A1 memory; the Always Free allowance is 12 GB in total."
  type        = number
  default     = 12
}

variable "boot_volume_gbs" {
  description = "Boot volume size; the Always Free allowance is 200 GB in total."
  type        = number
  default     = 50
}
