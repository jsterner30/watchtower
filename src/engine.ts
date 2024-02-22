import {
  Environment,
  Writer,
  Cache,
  ProgressBarManager,
  getBranches,
  downloadRepoToMemory,
  allReposCacheFileName,
  filteredWithBranchesCacheFileName,
  getOrgMembers, getOrg, getOrgTeams, getBranch, attachMetadataToCacheFile, getRepos, errorHandler
} from './util'
import { CacheFile, Repo } from './types'
import JSZip from 'jszip'
import { logger } from './util/logger'
import {
  getOrgReports,
  getOverallReports,
  getRepoReports,
  OrgReports,
  OverallReports,
  RepoReports
} from './reports/getReports'
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
  private readonly env: Environment
  private readonly branchRules: BranchRules
  private readonly secondaryBranchRules: SecondaryBranchRules
  private readonly repoRules: RepoRules
  private readonly orgRules: OrgRules
  private readonly repoReports: RepoReports
  private readonly overallReports: OverallReports
  private readonly orgReports: OrgReports
  private readonly writer: Writer
  private readonly cache: Cache
  private readonly progress: ProgressBarManager

  constructor (env: Environment, cache: Cache, writer: Writer) {
    this.env = env
    this.writer = writer
    this.cache = cache
    this.progress = new ProgressBarManager(env.showProgress)
    this.branchRules = getBranchRules()
    this.secondaryBranchRules = getSecondaryBranchRules()
    this.repoRules = getRepoRules()
    this.orgRules = getOrgRules()
    this.repoReports = getRepoReports()
    this.overallReports = getOverallReports()
    this.orgReports = getOrgReports()
  }

  async run (): Promise<void> {
    await this.cache.update()
    const allReposFile = await this.getReposCacheFile(this.cache.cache.allRepos)
    await this.cache.writeFileToCache(allReposCacheFileName, allReposFile)
    const filteredRepos = await this.filterArchived(allReposFile)
    const filteredWithBranchesFile = await this.getReposWithBranchesCacheFile(filteredRepos, this.cache.cache.filteredWithBranches, this.progress)
    await this.cache.writeFileToCache(filteredWithBranchesCacheFileName, filteredWithBranchesFile)
    await this.runOrgRules(filteredWithBranchesFile)
    await this.runRepoRules(filteredWithBranchesFile.info)
    await this.downloadAndRunBranchRules(filteredWithBranchesFile.info)
    await this.cache.setLastRunDate(new Date()) // we do this now because everything we are going to cache has now been cached
    await this.cache.update()
    const repos = this.cache.cache.repos

    // just get rid of all reports
    await this.writer.deleteAllFilesInDirectory('reports', '', '')
    await this.runRepoReports(repos)
    await this.runOrgReports()
    await this.runOverallReports(repos)

    await this.writeReports()
  }

  private async getReposCacheFile (reposCacheFile: CacheFile | null): Promise<CacheFile> {
    if (reposCacheFile != null && (Object.keys(reposCacheFile.info)).length > 0) {
      return reposCacheFile
    }
    logger.info('Getting all repos in org')
    try {
      const repoInfoObj: Record<string, Repo> = {}
      const repos = await getRepos()
      for (const repo of repos) {
        repoInfoObj[repo.name] = repo
      }

      return attachMetadataToCacheFile(repoInfoObj)
    } catch (error) {
      throw new Error(`Error occurred while fetching repositories: ${error as string}`)
    }
  }

  private async filterArchived (allReposFile: CacheFile): Promise<Repo[]> {
    const filteredRepos: Repo[] = []
    for (const repoName of Object.keys(allReposFile.info)) {
      const repo = allReposFile.info[repoName]
      if (!repo.archived) {
        filteredRepos.push(repo)
      }
    }
    return filteredRepos
  }

  private async getReposWithBranchesCacheFile (repos: Repo[], filteredWithBranches: CacheFile | null, progress: ProgressBarManager): Promise<CacheFile> {
    if (filteredWithBranches != null && (Object.keys(filteredWithBranches.info)).length !== 0) {
      return filteredWithBranches
    }

    logger.info('Getting all branches in org')
    progress.reset(repos.length, 'Getting branch info for repos', [{ displayName: 'Current Repo', token: 'currentRepo' }])
    progress.start()

    const branchCount = 0
    const reposWithBranches: Record<string, Repo> = {}

    for (const repo of repos) {
      try {
        progress.update([{ displayName: 'Current Repo', token: 'currentRepo', value: repo.name }])

        const branches = await getBranches(repo)
        for (const branch of branches) {
          repo.branches[branch.name] = branch
        }
      } catch (error: any) {
        logger.error(`Error getting branch info for ${repo.name}: ${error as string}`)
      }

      reposWithBranches[repo.name] = repo
    }
    return attachMetadataToCacheFile(reposWithBranches, branchCount)
  }

  private async runOrgRules (filteredWithBranchesFile: CacheFile): Promise<void> {
    for (const orgRule of Object.values(this.orgRules)) {
      await orgRule.run(filteredWithBranchesFile)
    }
  }

  private async runRepoRules (repos: Record<string, Repo>): Promise<void> {
    const repoNames = Object.keys(repos)
    this.progress.reset(repoNames.length, 'Running repo rules on', [{ displayName: 'Current Repo', token: 'currentRepo' }])
    this.progress.start()

    for (const repoName of repoNames) {
      this.progress.update([{ displayName: 'Current Repo', token: 'currentRepo', value: repoName }])
      for (const repoRule of Object.values(this.repoRules)) {
        await repoRule.run(repos[repoName])
      }
    }
  }

  private async downloadAndRunBranchRules (repos: Record<string, Repo>): Promise<void> {
    // get rid of the current cache repos
    await this.writer.deleteAllFilesInDirectory('cache', 'json', 'repos')

    const repoNames = Object.keys(repos)
    this.progress.reset(repoNames.length, 'Running rules on', [{ displayName: 'Current Repo', token: 'currentRepo' }])
    this.progress.start()

    for (const repoName of repoNames) {
      this.progress.update([{ displayName: 'Current Repo', token: 'currentRepo', value: repoName }])
      const repo = repos[repoName]

      if (repo.lastCommit.date > this.cache.cache.lastRunDate) {
        for (const branchName of Object.keys(repo.branches)) {
          try {
            // we don't run rules on dependabot branches
            if (!repo.branches[branchName].dependabot) {
              repo.branches[branchName] = await getBranch(repo, branchName)
              if (repo.branches[branchName].lastCommit.date > this.cache.cache.lastRunDate) {
                const downloaded = await downloadRepoToMemory(repoName, branchName)
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
            }
          } catch (error) {
            errorHandler(error, 'downloadAndRunBranchRules', repoName, branchName)
          }
        }
      }
      await this.cache.writeFileToCache(`repos/${repoName}.json`, repo)
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

  private async runRepoReports (repos: Repo[]): Promise<void> {
    for (const report of Object.values(this.repoReports)) {
      await report.run(repos)
    }
  }

  private async runOrgReports (): Promise<void> {
    logger.info('Getting and writing organization, org member, and org team reports')
    const orgMembers = await getOrgMembers()
    const orgTeams = await getOrgTeams()
    const org = await getOrg(orgTeams.map(team => team.name), orgMembers.map(member => member.name))
    await this.orgReports.orgReport.run([org])
    await this.orgReports.orgMemberReport.run(orgMembers)
    await this.orgReports.orgTeamReport.run(orgTeams)
  }

  private async runOverallReports (repos: Repo[]): Promise<void> {
    for (const report of Object.values(this.overallReports)) {
      await report.run(repos)
    }
  }

  private async writeReports (): Promise<void> {
    for (const report of Object.values(this.repoReports)) {
      for (const reportOutput of report.reportOutputDataWriters) {
        await reportOutput.writeOutput(this.writer)
      }
    }

    for (const report of Object.values(this.orgReports)) {
      for (const reportOutput of report.reportOutputDataWriters) {
        await reportOutput.writeOutput(this.writer)
      }
    }

    for (const report of Object.values(this.overallReports)) {
      for (const reportOutput of report.reportOutputDataWriters) {
        await reportOutput.writeOutput(this.writer)
      }
    }
  }
}
