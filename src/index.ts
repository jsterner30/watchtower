import {
  downloadReposAndApplyRules,
  getAllReposInOrg,
  getBranches,
  filterArchived,
  runReports
} from './github'
import { createDataDirectoriesIfNonexistent, getEnv, getLastRunDate, getOctokit, setLastRunDate } from './util'

async function run (): Promise<void> {
  // await createDataDirectoriesIfNonexistent()
  // const octokit = await getOctokit()
  // const env = await getEnv()
  // const info = await getLastRunDate()
  // const allReposFile = await getAllReposInOrg(env.githubOrg, octokit)
  // const filteredRepos = await filterArchived(allReposFile)
  // const filteredWithBranchesFile = await getBranches(octokit, filteredRepos)
  // await downloadReposAndApplyRules(filteredWithBranchesFile, octokit, info.lastRunDate)
  await runReports()
  await setLastRunDate()
}

void run()
