import EnvSsm from '@byu-oit/env-ssm'

export interface Environment {
  bucketName: string
  environmentName: string
  githubOrg: string
  githubToken: string
  showProgress: boolean
  staleDaysThreshold: number
  useCache: boolean
  writeFilesLocally: boolean
}

let params: Environment

export async function getEnv (): Promise<Environment> {
  if (params == null) {
    const env = await EnvSsm({ ssm: process.env.NODE_ENV !== 'production' })
    params = {
      bucketName: env.get('BUCKET_NAME').default('watchtower-dev').asString(),
      environmentName: env.get('ENVIRONMENT_NAME').default('dev').asEnum(['dev', 'prd']),
      githubOrg: env.get('GITHUB_ORG').required().asString(),
      githubToken: env.get('GITHUB_TOKEN').required().asString(),
      showProgress: env.get('SHOW_PROGRESS').default('false').asBool(),
      staleDaysThreshold: env.get('STALE_DAYS_THRESHOLD').default(30).asIntPositive(),
      useCache: env.get('USE_CACHE').default('false').asBool(),
      writeFilesLocally: env.get('WRITE_FILES_LOCALLY').default('false').asBool()
    }
  }
  return params
}
