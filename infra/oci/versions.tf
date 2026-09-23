terraform {
  required_version = ">= 1.8"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 7.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "oci" {
  region              = var.region
  config_file_profile = var.oci_config_profile
}
