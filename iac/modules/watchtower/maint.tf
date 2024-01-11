variable "env" {
  type = string
}

variable "name" {
  type = string
}

variable "schedule_expression" {
  type = string
}

variable "image_tag" {
  type = string
}

locals {
  parameter_store_prefix = "/${var.name}/${var.env}"
  app_name               = "${var.name}-${var.env}"
}

module "acs" {
  source = "github.com/byu-oit/terraform-aws-acs-info?ref=v3.5.0"
}

data "aws_ecr_repository" "api_repo" {
  name = local.app_name
}

module "nightly" {
  source   = "github.com/byu-oit/terraform-aws-scheduled-fargate?ref=v4.0.0"
  app_name = local.app_name
  schedule = {
    expression = var.schedule_expression
    timezone   = "America/Denver"
  }
  primary_container_definition = {
    name  = local.app_name
    image = "${data.aws_ecr_repository.api_repo.repository_url}:${var.image_tag}"
    environment_variables = {
      AWS_REGION = "us-west-2"
      GITHUB_ORG = "byu-oit"
    }
    secrets = {
      GITHUB_TOKEN = "${local.parameter_store_prefix}/GITHUB_TOKEN"
    }
  }
  event_role_arn                = module.acs.power_builder_role.arn
  vpc_id                        = module.acs.vpc.id
  private_subnet_ids            = module.acs.private_subnet_ids
  role_permissions_boundary_arn = module.acs.role_permissions_boundary.arn
}
