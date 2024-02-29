import { Writers } from '../report'
import { HeaderTitles, ReportWriter, startingHighestVersion, startingLowestVersion } from '../../util'
import { Repo } from '../../types'
import { RepoReport, RepoReportData } from '../repoReports/repoReport'

interface OverallRepoReportData extends RepoReportData {
  repoName: string
  teams: string[]
  admins: string[]
  visibility: string
  archived: boolean
  lastCommitDate: string
  lastCommitAuthor: string
  totalBranches: number
  totalStaleBranches: number
  totalDependabotBranches: number
  defaultBranch: string
  lowNodeVersion: string
  highNodeVersion: string
  lowTerraformVersion: string
  highTerraformVersion: string
  lowPythonVersion: string
  highPythonVersion: string
  followsDevPrdNamingScheme: boolean
  codeScanAlertCountCritical: number
  codeScanAlertCountHigh: number
  codeScanAlertCountMedium: number
  codeScanAlertCountLow: number
  dependabotAlertCountCritical: number
  dependabotAlertCountHigh: number
  dependabotAlertCountMedium: number
  dependabotAlertCountLow: number
  secretAlertCount: number
  primaryLanguage: string
  openPullRequests: number
  openIssues: number
  forksCount: number
  allowForking: boolean
}
interface OverallRepoReportWriters extends Writers<OverallRepoReportData> {
  overallRepoReportWriter: ReportWriter<OverallRepoReportData>
}

export class OverallRepoReport extends RepoReport<OverallRepoReportData, OverallRepoReportWriters> {
  protected async runReport (repo: Repo, writers: OverallRepoReportWriters): Promise<void> {
    writers.overallRepoReportWriter.addRow({
      repoName: repo.name,
      teams: repo.teams,
      admins: repo.admins,
      visibility: repo.visibility,
      archived: repo.archived,
      lastCommitDate: repo.lastCommit.date,
      lastCommitAuthor: repo.lastCommit.author,
      totalBranches: Object.keys(repo.branches).length,
      totalStaleBranches: repo.reportResults.staleBranchCount,
      totalDependabotBranches: repo.reportResults.dependabotBranchCount,
      defaultBranch: repo.defaultBranch,
      lowNodeVersion: repo.reportResults.lowNodeVersion === startingLowestVersion ? '??' : repo.reportResults.lowNodeVersion,
      highNodeVersion: repo.reportResults.highNodeVersion === startingHighestVersion ? '??' : repo.reportResults.highNodeVersion,
      lowTerraformVersion: repo.reportResults.lowTerraformVersion === startingLowestVersion ? '??' : repo.reportResults.lowTerraformVersion,
      highTerraformVersion: repo.reportResults.highTerraformVersion === startingHighestVersion ? '??' : repo.reportResults.highTerraformVersion,
      lowPythonVersion: repo.reportResults.lowPythonVersion === startingLowestVersion ? '??' : repo.reportResults.lowPythonVersion,
      highPythonVersion: repo.reportResults.highPythonVersion === startingHighestVersion ? '??' : repo.reportResults.highPythonVersion,
      followsDevPrdNamingScheme: repo.reportResults.followsDevPrdNamingScheme,
      codeScanAlertCountCritical: repo.codeScanAlerts.critical.length,
      codeScanAlertCountHigh: repo.codeScanAlerts.high.length,
      codeScanAlertCountMedium: repo.codeScanAlerts.medium.length,
      codeScanAlertCountLow: repo.codeScanAlerts.low.length,
      dependabotAlertCountCritical: repo.dependabotScanAlerts.critical.length,
      dependabotAlertCountHigh: repo.dependabotScanAlerts.high.length,
      dependabotAlertCountMedium: repo.dependabotScanAlerts.medium.length,
      dependabotAlertCountLow: repo.dependabotScanAlerts.low.length,
      secretAlertCount: repo.secretScanAlerts.critical.length,
      primaryLanguage: repo.language,
      openPullRequests: repo.openPullRequests.length,
      openIssues: repo.openIssues.length,
      forksCount: repo.forksCount,
      allowForking: repo.allowForking
    })
  }

  protected getReportWriters (): OverallRepoReportWriters {
    return {
      overallRepoReportWriter: new ReportWriter<OverallRepoReportData>(this.getHeaderTitles(), this._outputDir, this.name)
    }
  }

  protected getHeaderTitles (): HeaderTitles<OverallRepoReportData> {
    return {
      repoName: 'Repo',
      teams: 'Admin Teams',
      admins: 'Admin Users',
      visibility: 'Visibility',
      archived: 'Archived',
      lastCommitDate: 'Last Commit Date',
      lastCommitAuthor: 'Last Commit User',
      totalBranches: 'Total Number of Branches',
      totalStaleBranches: 'Total Number of Stale Branches',
      totalDependabotBranches: 'Total Number of Dependabot Branches',
      defaultBranch: 'Default Branch Name',
      lowNodeVersion: 'Lowest Node Version Across Any Branch',
      highNodeVersion: 'Highest Node Version Across Any Branch',
      lowTerraformVersion: 'Lowest Terraform Version Across Any Branch',
      highTerraformVersion: 'Highest Terraform Version Across Any Branch',
      lowPythonVersion: 'Lowest Python Version Across Any Branch',
      highPythonVersion: 'Highest Python Version Across Any Branch',
      followsDevPrdNamingScheme: 'Follows Standard Dev/Prd Naming Schema',
      codeScanAlertCountCritical: 'Critical Code Scan Alert Count',
      codeScanAlertCountHigh: 'High Code Scan Alert Count',
      codeScanAlertCountMedium: 'Medium Code Scan Alert Count',
      codeScanAlertCountLow: 'Low Code Scan Alert Count',
      dependabotAlertCountCritical: 'Critical Dependabot Alert Count',
      dependabotAlertCountHigh: 'High Dependabot Alert Count',
      dependabotAlertCountMedium: 'Medium Dependabot Alert Count',
      dependabotAlertCountLow: 'Low Dependabot Alert Count',
      secretAlertCount: 'Secret Alert Count',
      primaryLanguage: 'Primary Language',
      openPullRequests: 'Number of Open Pull Requests',
      openIssues: 'Number of Open Issues',
      forksCount: 'Number of Forks',
      allowForking: 'Allows Forking'
    }
  }

  public get name (): string {
    return OverallRepoReport.name
  }
}
