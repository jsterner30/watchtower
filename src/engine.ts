import {
  Environment,
  Writer,
  Cache,
  ProgressBarManager,
  getBranches,
  downloadRepoToMemory,
  allReposCacheFileName,
  filteredWithBranchesCacheFileName,
  getOrgMembers, getOrg, getOrgTeams, getBranch, attachMetadataToCacheFile, getRepos
} from './util'
import { Writers } from './reports/report'
import {
  CodeScanAlertCountReport,
  DependabotAlertScanCountReport,
  SecretScanAlertCountReport,
  CodeScanAlertReport,
  SecretScanAlertReport,
  DependabotBranchReport,
  DependabotAlertReport,
  StaleBranchReport,
  DockerfileImageReport,
  GHActionModuleReport,
  NPMDependencyReport,
  TerraformModuleReport,
  BranchLowFilesReport,
  DefaultBranchFileTypesReport,
  DevPrdBranchesReport,
  PrimaryLanguageReport,
  PublicAndInternalReport,
  ReadmeReport,
  RepoHasLanguageReport,
  RepoLowFilesReport,
  ReposWithoutNewCommitsReport,
  TeamlessRepoReport,
  NodeBranchVersionReport,
  TerraformBranchVersionReport,
  NodeRepoVersionReport,
  TerraformRepoVersionReport,
  OverallBranchReport,
  OverallRepoReport,
  OverallHealthScoreReport
} from './reports'
import { BranchRule, OrgWideRule, RepoRule, SecondaryBranchRule } from './rules/rule'
import {
  DeployedBranchRule,
  StaleBranchRule
} from './rules/secondaryBranchRules'
import {
  DockerComposeRule,
  DockerfileRule,
  DotGithubDirRule,
  FileCountRule,
  FileTypesRules,
  GitignoreRule,
  PackageJsonRule,
  PackageLockRule,
  ReadmeRule,
  TerraformRule
} from './rules/branchRules'
import {
  AdminsRule,
  GithubActionRunRule,
  LatestCommitRule,
  OpenIssueRule,
  OpenPRRule,
  TeamsRule
} from './rules/repoRules'
import {
  CodeScanAlertsRule,
  DependabotAlertsRule,
  SecretScanAlertsRule
} from './rules/orgRules'

import { CacheFile, Repo } from './types'
import JSZip from 'jszip'
import { logger } from './util/logger'
import { OrgReport } from './reports/orgReports/OrgReport'
import { OrgTeamReport } from './reports/orgReports/OrgTeamReport'
import { OrgMemberReport } from './reports/orgReports/OrgMemberReport'
import { RepoReport, RepoReportData } from './reports/repoReports/repoReport'

export class Engine {
  private readonly env: Environment
  private readonly branchRules: BranchRule[] = []
  private readonly secondaryBranchRules: SecondaryBranchRule[] = []
  private readonly repoRules: RepoRule[] = []
  private readonly orgRules: OrgWideRule[] = []
  private readonly reports: Array<RepoReport<RepoReportData, Writers<RepoReportData>>> = []
  private readonly overallReports: Array<RepoReport<RepoReportData, Writers<RepoReportData>>> = []
  private readonly writer: Writer
  private readonly cache: Cache
  private readonly progress: ProgressBarManager

  constructor (env: Environment, cache: Cache, writer: Writer) {
    this.env = env
    this.writer = writer
    this.cache = cache
    this.progress = new ProgressBarManager(env.showProgress)
    this.registerBranchRules()
    this.registerSecondaryBranchRules()
    this.registerRepoRules()
    this.registerOrgRules()
    this.registerReports()
    this.registerOverallReports()
  }

  async run (): Promise<void> {
    await this.getAndWriteOrgData()
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
    await this.runReports(repos)
    await this.writeReportOutputs()
    await this.runOverallReports(repos)
    await this.writeOverallReports()
  }

  private registerBranchRules (): void {
    this.branchRules.push(new DockerComposeRule())
    this.branchRules.push(new DockerfileRule())
    this.branchRules.push(new DotGithubDirRule())
    this.branchRules.push(new FileCountRule())
    this.branchRules.push(new FileTypesRules())
    this.branchRules.push(new GitignoreRule())
    this.branchRules.push(new PackageJsonRule())
    this.branchRules.push(new PackageLockRule())
    this.branchRules.push(new ReadmeRule())
    this.branchRules.push(new TerraformRule())
  }

  private registerSecondaryBranchRules (): void {
    this.secondaryBranchRules.push(new DeployedBranchRule())
    this.secondaryBranchRules.push(new StaleBranchRule())
  }

  private registerRepoRules (): void {
    this.repoRules.push(new LatestCommitRule())
    this.repoRules.push(new AdminsRule())
    this.repoRules.push(new TeamsRule())
    this.repoRules.push(new OpenPRRule())
    this.repoRules.push(new OpenIssueRule())
    this.repoRules.push(new GithubActionRunRule())
  }

  private registerOrgRules (): void {
    this.orgRules.push(new CodeScanAlertsRule())
    this.orgRules.push(new DependabotAlertsRule())
    this.orgRules.push(new SecretScanAlertsRule())
  }

  private registerReports (): void {
    // reports with 0 weight do not contribute to the overall health report
    this.reports.push(new CodeScanAlertCountReport(5, 'CodeScanAlertCountReports'))
    this.reports.push(new DependabotAlertScanCountReport(5, 'DependabotAlertCountReport'))
    this.reports.push(new SecretScanAlertCountReport(5, 'SecretScanAlertCountReport'))
    this.reports.push(new CodeScanAlertReport(0, 'CodeScanAlertReports'))
    this.reports.push(new DependabotAlertReport(0, 'DependabotAlertReport'))
    this.reports.push(new SecretScanAlertReport(0, 'SecretScanAlertReport'))
    this.reports.push(new DependabotBranchReport(4, 'DependabotBranchReport'))
    this.reports.push(new StaleBranchReport(2, 'StaleBranchReport'))
    this.reports.push(new DockerfileImageReport(3, 'DockerfileImageReport'))
    this.reports.push(new GHActionModuleReport(3, 'GhActionModuleReport'))
    this.reports.push(new NPMDependencyReport(3, 'NPMDependencyReport'))
    this.reports.push(new TerraformModuleReport(3, 'TerraformModuleReport'))
    this.reports.push(new BranchLowFilesReport(0, 'BranchLowFilesReport'))
    this.reports.push(new DefaultBranchFileTypesReport(0, 'FileTypesReport'))
    this.reports.push(new DevPrdBranchesReport(0, 'DevPrdBranchesReport'))
    this.reports.push(new PrimaryLanguageReport(0, 'PrimaryLanguageReport'))
    this.reports.push(new PublicAndInternalReport(2, 'PublicAndInternalReport'))
    this.reports.push(new ReadmeReport(3, 'ReadmeReport'))
    this.reports.push(new RepoHasLanguageReport(0, 'RepoHasLanguageReport'))
    this.reports.push(new RepoLowFilesReport(1, 'RepoLowFilesReport'))
    this.reports.push(new ReposWithoutNewCommitsReport(3, 'ReposWithoutNewCommitsReport'))
    this.reports.push(new TeamlessRepoReport(4, 'TeamlessRepoReport'))
    this.reports.push(new NodeBranchVersionReport(0, 'NodeVersionReport'))
    this.reports.push(new TerraformBranchVersionReport(0, 'TerraformVersionReport'))
    this.reports.push(new NodeRepoVersionReport(5, 'NodeVersionReport'))
    this.reports.push(new TerraformRepoVersionReport(5, 'TerraformVersionReport'))
  }

  private registerOverallReports (): void {
    this.overallReports.push(new OverallBranchReport(0, 'OverallReports'))
    this.overallReports.push(new OverallRepoReport(0, 'OverallReports'))
    this.overallReports.push(new OverallHealthScoreReport(0, 'OverallReports'))
  }

  private async getAndWriteOrgData (): Promise<void> {
    const orgMembers = await getOrgMembers()
    const orgTeams = await getOrgTeams()
    const org = await getOrg(orgTeams.map(team => team.name), orgMembers.map(member => member.name))
    await (new OrgReport(0, 'Organization')).run([org])
    await (new OrgMemberReport(0, 'Organization')).run(orgMembers)
    await (new OrgTeamReport(0, 'Organization')).run(orgTeams)
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

  private async runOrgRules (filteredWithBranchesFile: CacheFile): Promise<void> {
    for (const orgRule of this.orgRules) {
      await orgRule.run(filteredWithBranchesFile)
    }
  }

  private async runRepoRules (repos: Record<string, Repo>): Promise<void> {
    const repoNames = Object.keys(repos)
    this.progress.reset(repoNames.length, 'Running repo rules on', [{ displayName: 'Current Repo', token: 'currentRepo' }])
    this.progress.start()

    for (const repoName of repoNames) {
      this.progress.update([{ displayName: 'Current Repo', token: 'currentRepo', value: repoName }])
      for (const repoRule of this.repoRules) {
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
        }
      }
      await this.cache.writeFileToCache(`repos/${repoName}.json`, repo)
    }
  }

  private async runBranchRules (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    for (const branchRule of this.branchRules) {
      await branchRule.run(repo, downloaded, branchName, fileName)
    }
  }

  private async runSecondaryBranchRules (repo: Repo, branchName: string): Promise<void> {
    for (const secondaryBranchRule of this.secondaryBranchRules) {
      await secondaryBranchRule.run(repo, branchName)
    }
  }

  private async runReports (repos: Repo[]): Promise<void> {
    for (const report of this.reports) {
      await report.run(repos)
    }
  }

  private async writeReportOutputs (): Promise<void> {
    // just get rid of all reports
    await this.writer.deleteAllFilesInDirectory('reports', '', '')

    for (const report of this.reports) {
      for (const reportOutput of report.reportOutputDataWriters) {
        await reportOutput.writeOutput(this.writer)
      }
    }
  }

  private async runOverallReports (repos: Repo[]): Promise<void> {
    for (const report of this.overallReports) {
      await report.run(repos)
    }
  }

  private async writeOverallReports (): Promise<void> {
    for (const report of this.overallReports) {
      for (const reportOutput of report.reportOutputDataWriters) {
        await reportOutput.writeOutput(this.writer)
      }
    }
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
}
