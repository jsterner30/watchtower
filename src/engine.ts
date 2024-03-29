import {
  Writer,
  Cache,
  ProgressBarManager,
  getBranches,
  downloadRepoToMemory,
  getOrgMembers,
  getOrg,
  getOrgTeams,
  getRepos,
  errorHandler,
  getRepo,
  apiCallCounter,
  stringifyJSON,
  getEnv
} from './util'
import { Repo } from './types'
import JSZip from 'jszip'
import { logger } from './util/logger'
import {
  getOrgReports,
  getOverallReports,
  getRepoReports,
  OrgReports,
  OverallReports,
  RepoReports
} from './reports/'
import {
  BranchRules,
  getBranchRules,
  getSecondaryBranchRules,
  SecondaryBranchRules,
  RepoRules,
  OrgRules,
  getRepoRules, getOrgRules
} from './rules/getRules'

export class Engine {
  private readonly branchRules: BranchRules
  private readonly secondaryBranchRules: SecondaryBranchRules
  private readonly repoRules: RepoRules
  private readonly orgRules: OrgRules
  private readonly repoReports: RepoReports
  private readonly overallReports: OverallReports
  private readonly orgReports: OrgReports
  private readonly reportWriter: Writer
  private readonly cache: Cache
  private readonly progress: ProgressBarManager
  private readonly getReposFunction: () => Promise<Record<string, Repo>>

  constructor (cache: Cache, reportWriter: Writer) {
    if (getEnv().runLimitedTest && getEnv().testRepoList.length > 0) {
      this.getReposFunction = this.getLimitedNumberOfReposForTesting
    } else {
      this.getReposFunction = this.getRepos
    }

    this.reportWriter = reportWriter
    this.cache = cache
    this.progress = new ProgressBarManager(getEnv().showProgress)
    this.branchRules = getBranchRules()
    this.secondaryBranchRules = getSecondaryBranchRules()
    this.repoRules = getRepoRules()
    this.orgRules = getOrgRules()
    this.repoReports = getRepoReports()
    this.overallReports = getOverallReports()
    this.orgReports = getOrgReports()
  }

  async run (): Promise<void> {
    const allRepos = await this.getReposFunction()
    const nonEmptyRepos = this.filterEmpty(allRepos)
    const filteredRepos = this.filterArchived(nonEmptyRepos)
    await this.runOrgRules(filteredRepos)
    await this.cache.writeReposToCache(filteredRepos)

    this.progress.reset(this.cache.repoList.length, 'Running watchtower on repos', [{ displayName: 'Current Repo', token: 'currentRepo' }])
    this.progress.start()
    for (const repoName of this.cache.repoList) {
      this.progress.update([{ displayName: 'Current Repo', token: 'currentRepo', value: repoName }])

      const repo = await this.cache.getRepo(repoName)
      if (repo != null) {
        await this.getRepoBranches(repo)
        await this.runRepoRules(repo)
        await this.downloadAndRunBranchRules(repo)
        await this.runRepoReports(repo)
        await this.runOverallReportsOnRepo(repo)
        await this.cache.writeRepoToCache(repo)
      } else {
        logger.error(`Null repo returned for repo: ${repoName}`)
      }
    }
    await this.runOrgReports()

    await this.cache.deleteAllFilesInCache()
    await this.writeReports()
    await this.cache.writeFileToCache('json', 'apiCallCounter.json', stringifyJSON(apiCallCounter, 'apiCallCounter'))
  }

  async runWithCache (): Promise<void> {
    this.progress.reset(this.cache.repoList.length, 'Running watchtower on repos', [{ displayName: 'Current Repo', token: 'currentRepo' }])
    this.progress.start()
    for (const repoName of this.cache.repoList) {
      this.progress.update([{ displayName: 'Current Repo', token: 'currentRepo', value: repoName }])

      const repo = await this.cache.getRepo(repoName)
      if (repo != null) {
        await this.runRepoReports(repo)
        await this.runOverallReportsOnRepo(repo)
      } else {
        logger.error(`Null repo returned for repo: ${repoName}`)
      }
    }
    await this.runOrgReports()
    await this.writeReports()
  }

  private async getRepos (): Promise<Record<string, Repo>> {
    logger.info('Getting all repos in org')
    try {
      return (await getRepos()).reduce((acc: Record<string, any>, repo) => {
        acc[repo.name] = repo
        return acc
      }, {})
    } catch (error) {
      throw new Error(`Error occurred while fetching repositories: ${(error as Error).message}`)
    }
  }

  private async getLimitedNumberOfReposForTesting (): Promise<Record<string, Repo>> {
    logger.warn('The full report will not run because the environment variable RUN_LIMITED_TEST was set to true and TEST_REPO_LIST was found')
    logger.info('Getting the list of repos in found in the TEST_REPO_LIST environment variable')
    logger.info(`Test repo list: [${getEnv().testRepoList.join(',')}]`)
    try {
      const repos: Record<string, Repo> = {}
      for (const repoName of getEnv().testRepoList) {
        const repo = await getRepo(repoName)
        if (repo != null) {
          repos[repoName] = repo
        }
      }

      return repos
    } catch (error) {
      throw new Error(`Error occurred while fetching repositories: ${(error as Error).message}`)
    }
  }

  private filterEmpty (repos: Record<string, Repo>): Record<string, Repo> {
    return this.filterReposOnProperty(repos, 'empty', true)
  }

  // this function will skip filtering the archived repos in the org if the FILTER_ARCHIVED env var is set to false
  private filterArchived (repos: Record<string, Repo>): Record<string, Repo> {
    if (!getEnv().filterArchived) {
      logger.warn('Env var FILTER_ARCHIVED set to false, will not filter archived repos')
      return repos
    }
    return this.filterReposOnProperty(repos, 'archived', true)
  }

  private filterReposOnProperty (repos: Record<string, Repo>, property: keyof Repo, valueToFilter: string | number | boolean): Record<string, Repo> {
    const filteredRepos: Record<string, Repo> = {}

    for (const [key, repo] of Object.entries(repos)) {
      if (repo[property] !== valueToFilter) {
        filteredRepos[key] = repo
      }
    }

    return filteredRepos
  }

  private async runOrgRules (repos: Record<string, Repo>): Promise<void> {
    logger.info('running org reports')
    for (const orgRule of Object.values(this.orgRules)) {
      await orgRule.run(repos)
    }
  }

  private async getRepoBranches (repo: Repo): Promise<void> {
    try {
      const branches = await getBranches(repo)
      for (const branch of branches) {
        repo.branches[branch.name] = branch
      }
    } catch (error: any) {
      logger.error(`Error getting branch info for ${repo.name}: ${(error as Error).message}`)
    }
  }

  private async runRepoRules (repo: Repo): Promise<void> {
    for (const repoRule of Object.values(this.repoRules)) {
      await repoRule.run(repo)
    }
  }

  private async downloadAndRunBranchRules (repo: Repo): Promise<void> {
    for (const branchName of Object.keys(repo.branches)) {
      try {
        // we don't run rules on dependabot branches
        if (!repo.branches[branchName].dependabot) {
          const downloaded = await downloadRepoToMemory(repo.name, branchName)
          if (downloaded != null) {
            for (const fileName of Object.keys(downloaded.files)) {
              if (!downloaded.files[fileName].dir) { // only run rules on files, not dirs
                await this.runBranchRules(repo, downloaded, branchName, fileName)
              }
            }
            // these are rules that rely on the initial branch rules
            await this.runSecondaryBranchRules(repo, branchName)
          }
        }
      } catch (error) {
        errorHandler(error, 'downloadAndRunBranchRules', repo.name, branchName)
      }
    }
  }

  private async runBranchRules (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    for (const branchRule of Object.values(this.branchRules)) {
      await branchRule.run(repo, downloaded, branchName, fileName)
    }
  }

  private async runSecondaryBranchRules (repo: Repo, branchName: string): Promise<void> {
    for (const secondaryBranchRule of Object.values(this.secondaryBranchRules)) {
      await secondaryBranchRule.run(repo, branchName)
    }
  }

  private async runRepoReports (repo: Repo): Promise<void> {
    for (const report of Object.values(this.repoReports)) {
      await report.run(repo)
    }
  }

  private async runOrgReports (): Promise<void> {
    logger.info('Getting and writing organization, org member, and org team reports')
    const orgMembers = await getOrgMembers()
    const orgTeams = await getOrgTeams()
    const org = await getOrg(orgTeams.map(team => team.name), orgMembers.map(member => member.name))
    await this.orgReports.orgReport.run(org)
    for (const member of orgMembers) {
      await this.orgReports.orgMemberReport.run(member)
    }
    for (const teams of orgTeams) {
      await this.orgReports.orgTeamReport.run(teams)
    }
  }

  private async runOverallReportsOnRepo (repo: Repo): Promise<void> {
    for (const report of Object.values(this.overallReports)) {
      await report.run(repo)
    }
  }

  private async writeReports (): Promise<void> {
    for (const report of Object.values(this.repoReports)) {
      for (const reportOutput of report.reportWriters) {
        await reportOutput.writeOutput(this.reportWriter)
      }
    }

    for (const report of Object.values(this.orgReports)) {
      for (const reportOutput of report.reportWriters) {
        await reportOutput.writeOutput(this.reportWriter)
      }
    }

    for (const report of Object.values(this.overallReports)) {
      for (const reportOutput of report.reportWriters) {
        await reportOutput.writeOutput(this.reportWriter)
      }
    }
  }
}
