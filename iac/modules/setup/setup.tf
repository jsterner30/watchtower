locals {
  gh_org  = "byu-oit"
  gh_repo = "watchtower2" // TODO: change me when we create a better name
}

variable "name" {
  type = string
}

variable "env" {
  type = string
}

variable "github_token" {
  type      = string
  sensitive = true
}

// To create these resources, run:
// terraform apply -var-file="env.tfvars"
resource "aws_ssm_parameter" "secrets" {
  for_each = {
    DB_USERNAME = var.github_token
  }
  name  = "/${var.name}/${var.env}/${each.key}"
  type  = "SecureString"
  value = each.value
}

module "my_ecr" {
  for_each = toset(["watchtower"])
  source   = "github.com/byu-oit/terraform-aws-ecr?ref=v2.0.1"
  name     = "${var.name}-${each.key}-${var.env}"
}

module "acs" {
  source = "github.com/byu-oit/terraform-aws-acs-info?ref=v4.0.0"
}

module "gha_role" {
  source                         = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version                        = "5.17.0"
  create_role                    = true
  role_name                      = "${var.name}-${var.env}-gha"
  provider_url                   = module.acs.github_oidc_provider.url
  role_permissions_boundary_arn  = module.acs.role_permissions_boundary.arn
  role_policy_arns               = module.acs.power_builder_policies[*].arn
  oidc_fully_qualified_audiences = ["sts.amazonaws.com"]
  oidc_subjects_with_wildcards   = ["repo:${local.gh_org}/${local.gh_repo}:*"]
}
