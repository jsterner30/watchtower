import EnvSsm from '@byu-oit/env-ssm'

export interface Environment {
  environmentName: string
  githubOrg: string
  githubToken: string
  staleDaysThreshold: number
}

let params: Environment

export async function getEnv (): Promise<Environment> {
  if (params == null) {
    const env = await EnvSsm({ ssm: process.env.NODE_ENV !== 'production' })
    params = {
      environmentName: env.get('ENVIRONMENT_NAME').default('dev').asEnum(['dev', 'prd']),
      githubOrg: env.get('GITHUB_ORG').required().asString(),
      githubToken: env.get('GITHUB_TOKEN').required().asString(),
      staleDaysThreshold: env.get('STALE_DAYS_THRESHOLD').default(30).asIntPositive()
    }
  }
  return params
}
