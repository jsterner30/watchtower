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
  runLimitedTest: boolean
  testRepoList: string[]
  filterArchived: boolean
  filterReportExceptions: boolean
}

let params: Environment | null = null

export function getEnv (): Environment {
  if (params == null) {
    throw new Error('Must run initializeEnv() before first use')
  }
  return params
}

export async function initializeEnv (): Promise<void> {
  if (params == null) {
    const env = await EnvSsm({ ssm: process.env.NODE_ENV !== 'production' })
    params = {
      bucketName: env.get('BUCKET_NAME').required().asString(),
      environmentName: env.get('ENVIRONMENT_NAME').default('dev').asEnum(['dev', 'prd']),
      githubOrg: env.get('GITHUB_ORG').required().asString(),
      githubToken: env.get('GITHUB_TOKEN').required().asString(),
      showProgress: env.get('SHOW_PROGRESS').default('false').asBool(),
      staleDaysThreshold: env.get('STALE_DAYS_THRESHOLD').default(30).asIntPositive(),
      useCache: env.get('USE_CACHE').default('false').asBool(),
      writeFilesLocally: env.get('WRITE_FILES_LOCALLY').default('false').asBool(),
      runLimitedTest: env.get('RUN_LIMITED_TEST').default('false').asBool(),
      testRepoList: env.get('TEST_REPO_LIST').default([]).asArray(),
      filterArchived: env.get('FILTER_ARCHIVED').default('true').asBool(),
      filterReportExceptions: env.get('FILTER_REPORT_EXCEPTIONS').required().asBool()
    }
  }
}
