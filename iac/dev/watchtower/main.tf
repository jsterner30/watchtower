terraform {
  required_version = "1.6.6"
  backend "s3" {
    bucket         = "terraform-state-storage-543804410856"
    dynamodb_table = "terraform-state-lock-543804410856"
    key            = "watchtower/dev/watchtower.tfstate"
    region         = "us-west-2"
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

locals {
  env                 = "dev"
  name                = "watchtower"
  schedule_expression = "cron(0 7 31 12 ? 2099)" // never runs, just meant to be triggered for testing
}

variable "image_tag" {
  type = string
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

module "watchtower" {
  source              = "../../modules/watchtower/"
  env                 = local.env
  name                = local.name
  schedule_expression = local.schedule_expression
  image_tag           = var.image_tag
}
