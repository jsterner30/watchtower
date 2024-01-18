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

module "watchtower" {
  source   = "github.com/byu-oit/terraform-aws-scheduled-fargate?ref=v4.0.0"
  app_name = local.app_name
  schedule = {
    expression = var.schedule_expression
    timezone   = "America/Denver"
  }
  primary_container_definition = {
    name  = local.app_name
    image = "${data.aws_ecr_repository.api_repo.repository_url}:${var.image_tag}"
    task_cpu = 512
    task_memory = 4096 # task keeps failing when it runs out of memory
    environment_variables = {
      AWS_REGION           = "us-west-2"
      BUCKET_NAME          = aws_s3_bucket.my_s3_bucket.bucket
      GITHUB_ORG           = "byu-oit"
      SHOW_PROGRESS        = "false"
      STALE_DAYS_THRESHOLD = 30
      USE_CACHE            = "true"
      WRITE_FILES_LOCALLY  = "false"
    }
    secrets = {
      GITHUB_TOKEN = "${local.parameter_store_prefix}/GITHUB_TOKEN"
    }
  }
  task_policies                 = [aws_iam_policy.my_s3_policy.arn]
  vpc_id                        = module.acs.vpc.id
  private_subnet_ids            = module.acs.private_subnet_ids
  role_permissions_boundary_arn = module.acs.role_permissions_boundary.arn
}


resource "aws_s3_bucket" "my_s3_bucket" {
  bucket = "${local.app_name}-output"
}

resource "aws_s3_bucket_public_access_block" "default" {
  bucket                  = aws_s3_bucket.my_s3_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_iam_policy" "my_s3_policy" {
  name        = "${local.app_name}-s3-${var.env}"
  description = "A policy to allow access to s3 to this bucket: ${aws_s3_bucket.my_s3_bucket.bucket}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": [
        "${aws_s3_bucket.my_s3_bucket.arn}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:DeleteObjectVersion",
        "s3:DeleteObject",
        "s3:PutObject",
        "s3:ListObject",
        "s3:HeadObject"
      ],
      "Resource": [
        "${aws_s3_bucket.my_s3_bucket.arn}/*"
      ]
    }
  ]
}
EOF
}

