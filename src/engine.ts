import {
  Environment,
  getEnv,
  Writer,
  Cache,
  S3Writer,
  LocalWriter,
  ProgressBarManager,
  getOverallGPAScore,
  ReportOutputData
} from './util'
import { Report } from './reports/report'
import {
  CodeScanAlertCountReport,
  CodeScanAlertReport,
  DependabotAlertReport,
  DependabotBranchReport,
  DevPrdBranchesReport,
  DockerfileImageReport,
  FileTypesReport,
  GhActionModuleReport,
  LanguageReport,
  LowFilesReport,
  NPMDependencyReport,
  NodeVersionReport,
  PublicAndInternalReport,
  ReadmeReport,
  ReposWithoutNewCommitsReport,
  SecretScanAlertReport,
  SecretScanAlertCountReport,
  StaleBranchReport,
  TeamlessRepoReport,
  TerraformModuleReport,
  TerraformVersionReport
} from './reports/reports'
import { DependabotAlertCountReport } from './reports/reports/dependabotAlertCountReport'
import { BranchRule, OrgRule, RepoRule, SecondaryBranchRule } from './rules/rule'
import {
  DeployedBranchRule,
  StaleBranchRule
} from './rules/secondaryBranchRules'
import {
  FileCountRule,
  DockerfileRule,
  PackageJsonRule,
  GitignoreRule,
  DotGithubDirRule,
  DockerComposeRule,
  PackageLockRule,
  TerraformRule,
  ReadmeRule
} from './rules/branchRules'
import {
  LatestCommitRule,
  AdminsRule,
  TeamsRule,
  OpenPRRule,
  OpenIssueRule,
  GithubActionRunRule
} from './rules/repoRules'
import {
  CodeScanAlertsRule,
  DependabotAlertsRule,
  SecretScanAlertsRule
} from './rules/orgRules'
import { Octokit } from '@octokit/rest'
import { getAllReposInOrg, getBranches, getBranchCommitInfo, downloadRepoToMemory } from './util/github'
import { CacheFile, GradeEnum, RepoInfo } from './types'
import JSZip from 'jszip'

export class Engine {
  private readonly octokit: Octokit
  private readonly branchRules: BranchRule[] = []
  private readonly secondaryBranchRules: SecondaryBranchRule[] = []
  private readonly repoRules: RepoRule[] = []
  private readonly orgRules: OrgRule[] = []
  private readonly reports: Report[] = []
  private readonly writer: Writer
  private readonly cache: Cache
  private readonly progress: ProgressBarManager

  constructor (env: Environment, octokit: Octokit) {
    this.octokit = octokit
    this.registerBranchRules(this.octokit)
    this.registerSecondaryBranchRules(this.octokit)
    this.registerRepoRules(this.octokit)
    this.registerOrgRules(this.octokit)
    this.registerReports()

    this.writer = new S3Writer()
    if (env.writeFilesLocally) {
      this.writer = new LocalWriter()
    }
    this.cache = new Cache(this.writer, env.useCache)
    this.progress = new ProgressBarManager(env.showProgress)
  }

  async run (): Promise<void> {
    const env = await getEnv()
    await this.cache.update()
    const allReposFile = await getAllReposInOrg(env.githubOrg, this.octokit, this.cache.cache.allRepos)
    await this.cache.writeFileToCache('allRepos.json', allReposFile)
    const filteredRepos = await this.filterArchived(allReposFile)
    const filteredWithBranchesFile = await getBranches(this.octokit, filteredRepos, this.cache.cache.filteredWithBranches, this.progress)
    await this.cache.writeFileToCache('filteredWithBranches.json', filteredWithBranchesFile)
    await this.runOrgRules(filteredWithBranchesFile)
    await this.runRepoRules(filteredWithBranchesFile.info)
    await this.downloadAndRunBranchRules(filteredWithBranchesFile.info)
    await this.runReports()
    await this.writeReportOutputs()
    await this.generateOverallReport()
    await this.cache.setLastRunDate()
  }

  private registerBranchRules (octokit: Octokit): void {
    this.branchRules.push(new FileCountRule(octokit))
    this.branchRules.push(new DockerfileRule(octokit))
    this.branchRules.push(new PackageJsonRule(octokit))
    this.branchRules.push(new GitignoreRule(octokit))
    this.branchRules.push(new DotGithubDirRule(octokit))
    this.branchRules.push(new DockerComposeRule(octokit))
    this.branchRules.push(new PackageLockRule(octokit))
    this.branchRules.push(new TerraformRule(octokit))
    this.branchRules.push(new ReadmeRule(octokit))
  }

  private registerSecondaryBranchRules (octokit: Octokit): void {
    this.secondaryBranchRules.push(new DeployedBranchRule(octokit))
    this.secondaryBranchRules.push(new StaleBranchRule(octokit))
  }

  private registerRepoRules (octokit: Octokit): void {
    this.repoRules.push(new LatestCommitRule(octokit))
    this.repoRules.push(new AdminsRule(octokit))
    this.repoRules.push(new TeamsRule(octokit))
    this.repoRules.push(new OpenPRRule(octokit))
    this.repoRules.push(new OpenIssueRule(octokit))
    this.repoRules.push(new GithubActionRunRule(octokit))
  }

  private registerOrgRules (octokit: Octokit): void {
    this.orgRules.push(new CodeScanAlertsRule(octokit))
    this.orgRules.push(new DependabotAlertsRule(octokit))
    this.orgRules.push(new SecretScanAlertsRule(octokit))
  }

  private registerReports (): void {
    // reports with 0 weight do not contribute to the overall health report
    this.reports.push(new CodeScanAlertCountReport(5, 'CodeScanAlertCountReports'))
    this.reports.push(new CodeScanAlertReport(0, 'CodeScanAlertReports'))
    this.reports.push(new DependabotAlertCountReport(5, 'DependabotAlertCountReport'))
    this.reports.push(new DependabotAlertReport(0, 'DependabotAlertReport'))
    this.reports.push(new DependabotBranchReport(4, 'DependabotBranchReport'))
    this.reports.push(new DevPrdBranchesReport(0, 'DevPrdBranchesReport'))
    this.reports.push(new DockerfileImageReport(3, 'DockerfileImageReport'))
    this.reports.push(new FileTypesReport(0, 'FileTypesReport'))
    this.reports.push(new GhActionModuleReport(3, 'GhActionModuleReport'))
    this.reports.push(new LanguageReport(0, 'LanguageReport'))
    this.reports.push(new LowFilesReport(1, 'LowFilesReport'))
    this.reports.push(new NPMDependencyReport(3, 'NPMDependencyReport'))
    this.reports.push(new NodeVersionReport(5, 'NodeVersionReport'))
    this.reports.push(new PublicAndInternalReport(2, 'PublicAndInternalReport'))
    this.reports.push(new ReadmeReport(3, 'ReadmeReport'))
    this.reports.push(new ReposWithoutNewCommitsReport(3, 'ReposWithoutNewCommitsReport'))
    this.reports.push(new SecretScanAlertCountReport(5, 'SecretScanAlertCountReport'))
    this.reports.push(new SecretScanAlertReport(0, 'SecretScanAlertReport'))
    this.reports.push(new StaleBranchReport(2, 'StaleBranchReport'))
    this.reports.push(new TeamlessRepoReport(4, 'TeamlessRepoReport'))
    this.reports.push(new TerraformModuleReport(3, 'TerraformModuleReport'))
    this.reports.push(new TerraformVersionReport(5, 'TerraformVersionReport'))
  }

  private async filterArchived (allReposFile: CacheFile): Promise<RepoInfo[]> {
    const filteredRepos: RepoInfo[] = []
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

  private async runRepoRules (repos: Record<string, RepoInfo>): Promise<void> {
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

  private async downloadAndRunBranchRules (repos: Record<string, RepoInfo>): Promise<void> {
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
            repo.branches[branchName].lastCommit = await getBranchCommitInfo(this.octokit, repoName, branchName)
            if (repo.branches[branchName].lastCommit.date > this.cache.cache.lastRunDate) {
              const downloaded = await downloadRepoToMemory(this.octokit, repoName, branchName)
              if (downloaded != null) {
                for (const fileName of Object.keys(downloaded.files)) {
                  if (!downloaded.files[fileName].dir) {
                    await this.runBranchRules(repo, downloaded, branchName, fileName)
                  }
                }
                // these are rules that rely on the initial branch rules
                await this.runSecondaryBranchRules(repo, branchName)
              }
            }
          }
        }
        await this.cache.writeFileToCache(`repos/${repoName}.json`, repo)
      }
    }
  }

  private async runBranchRules (repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    for (const branchRule of this.branchRules) {
      await branchRule.run(repo, downloaded, branchName, fileName)
    }
  }

  private async runSecondaryBranchRules (repo: RepoInfo, branchName: string): Promise<void> {
    for (const secondaryBranchRule of this.secondaryBranchRules) {
      await secondaryBranchRule.run(repo, branchName)
    }
  }

  private async runReports (): Promise<void> {
    // refresh repos now that we have ran our rules
    await this.cache.update()
    for (const report of this.reports) {
      await report.run(this.cache.cache.repos)
    }
  }

  private async writeReportOutputs (): Promise<void> {
    // just get rid of all reports
    await this.writer.deleteAllFilesInDirectory('reports', 'csv', '')
    await this.writer.deleteAllFilesInDirectory('reports', 'json', '')

    for (const report of this.reports) {
      for (const reportOutput of report.reportOutputs) {
        await reportOutput.writeOutput(this.writer)
      }
    }
  }

  private async generateOverallReport (): Promise<void> {
    const header = [
      { id: 'repoName', title: 'Repo' },
      { id: 'overallScore', title: 'Overall Score/Grade' },
      { id: 'teams', title: 'Admin Teams' },
      { id: 'lastCommitDate', title: 'Last Commit Date' },
      { id: 'lastCommitAuthor', title: 'Last Commit User' }
    ]

    for (const report of this.reports) {
      // only include contributing reports
      if (report.weight > 0) {
        header.push({
          id: report.name,
          title: report.name
        })
      }
    }
    const overallHealthReportOutput = new ReportOutputData(header, 'OverallHealthReport', 'overallHealthReport')

    const repos = this.cache.cache.repos
    for (const repo of repos) {
      const overallScore = getOverallGPAScore(repo.healthScores)
      const reportRow: Record<string, any> = {
        repoName: repo.name,
        overallScore,
        teams: repo.teams,
        lastCommitDate: repo.lastCommit.date,
        lastCommitAuthor: repo.lastCommit.author
      }

      for (const report of this.reports) {
        // only include contributing reports
        if (report.weight > 0) {
          reportRow[report.name] = repo.healthScores[report.name] ?? GradeEnum.NotApplicable
        }
      }
      overallHealthReportOutput.addRow({
        reportRow
      })
    }

    await overallHealthReportOutput.writeOutput(this.writer)
  }
}
