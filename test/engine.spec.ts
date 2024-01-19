// TODO: CREATE WORKING TESTS (AVA and Node 20 don't play nice with typescript)

// import test from 'ava'
// import { Engine } from '../src/engine'
// import { Environment, getEnv } from '../src/util'
// import { getMockOctokit } from './util'
// import { Octokit } from '@octokit/rest'
//
// let engine: Engine
// let moctokit: Octokit
// const defaultEnvironment = {
//   bucketName: 'fakeBucket',
//   environmentName: 'dev',
//   githubOrg: 'fake-org',
//   githubToken: 'fakeToken',
//   showProgress: false,
//   staleDaysThreshold: 30,
//   useCache: false,
//   writeFilesLocally: false
// }
// const setEnv = (env: Environment = defaultEnvironment): void => {
//   process.env.BUCKET_NAME = env.bucketName.toString()
//   process.env.ENVIRONMENT_NAME = env.environmentName.toString()
//   process.env.GITHUB_ORG = env.githubOrg.toString()
//   process.env.GITHUB_TOKEN = env.githubToken.toString()
//   process.env.SHOW_PROGRESS = env.showProgress.toString()
//   process.env.STALE_DAYS_THRESHOLD = env.staleDaysThreshold.toString()
//   process.env.USE_CACHE = env.useCache.toString()
//   process.env.WRITE_FILES_LOCALLY = env.writeFilesLocally.toString()
// }
//
// test.beforeEach(t => {
//   setEnv(defaultEnvironment)
//   moctokit = getMockOctokit()
// })
//
// test.serial('should not attempt to access cache if USE_CACHE set to false', async t => {
//   engine = new Engine(await getEnv(), moctokit)
//   t.deepEqual(true, true)
// })
