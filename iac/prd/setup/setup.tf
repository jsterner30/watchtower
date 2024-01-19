terraform {
  backend "s3" {
    bucket         = "terraform-state-storage-543804410856"
    dynamodb_table = "terraform-state-lock-543804410856"
    key            = "watchtower/prd/setup.tfstate"
    region         = "us-west-2"
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

locals {
  name = "watchtower"
  env  = "prd"
}

provider "aws" {
  region = "us-west-2"
  default_tags {
    tags = {
      env              = local.env
      data-sensitivity = "highly-confidential"
      repo             = "https://github.com/byu-oit/${local.name}"
    }
  }
}

variable "github_token" {
  type      = string
  sensitive = true
}

module "setup" {
  source       = "../../modules/setup/"
  name         = local.name
  env          = local.env
  github_token = var.github_token
}
