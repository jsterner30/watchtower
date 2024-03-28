import { Writers } from '../report'
import { HeaderTitles, ReportWriter } from '../../util'
import { Repo } from '../../types'
import { RepoReport, RepoReportData } from '../repoReports/repoReport'

interface OverallBranchReportData extends RepoReportData {
  repoName: string
  branchName: string
  teams: string[]
  admins: string[]
  lastCommitDate: string
  lastCommitAuthor: string
  lowNodeVersion: string
  highNodeVersion: string
  lowTerraformVersion: string
  highTerraformVersion: string
  lowPythonVersion: string
  highPythonVersion: string
  default: boolean
  stale: boolean
  deployed: boolean
  protected: boolean
  lastPushActionRunConclusion: string
  lastPushActionRunDate: string
  lastSuccessfulPushActionRunDate: string
}
interface OverallBranchReportWriters extends Writers<OverallBranchReportData> {
  overallBranchReportWriter: ReportWriter<OverallBranchReportData>
}

export class OverallBranchReport extends RepoReport<OverallBranchReportData, OverallBranchReportWriters> {
  protected async runReport (repo: Repo, writers: OverallBranchReportWriters): Promise<void> {
    for (const branchName in repo.branches) {
      const branch = repo.branches[branchName]
      const pushActions = branch.actionRuns.filter(obj => obj.event === 'push')
      const successfulPushActions = pushActions.filter(obj => obj.conclusion === 'success')

      if (!branch.dependabot) {
        const reportRow = {
          repoName: repo.name,
          branchName,
          teams: repo.teams,
          admins: repo.admins,
          lastCommitDate: branch.lastCommit.date,
          lastCommitAuthor: branch.lastCommit.author,
          lowNodeVersion: branch.reportResults.lowNodeVersion,
          highNodeVersion: branch.reportResults.highNodeVersion,
          lowTerraformVersion: branch.reportResults.lowTerraformVersion,
          highTerraformVersion: branch.reportResults.highTerraformVersion,
          lowPythonVersion: branch.reportResults.lowPythonVersion,
          highPythonVersion: branch.reportResults.highPythonVersion,
          default: repo.defaultBranch === branchName,
          stale: branch.staleBranch,
          deployed: branch.deployedBranch,
          protected: branch.branchProtections.protected,
          lastPushActionRunConclusion: pushActions[0] != null ? pushActions[0].conclusion : 'none',
          lastPushActionRunDate: pushActions[0] != null ? pushActions[0].created_at : 'none',
          lastSuccessfulPushActionRunDate: successfulPushActions[0] != null ? successfulPushActions[0].created_at : 'none'
        }

        writers.overallBranchReportWriter.addRow(reportRow)
      }
    }
  }

  protected getReportWriters (): OverallBranchReportWriters {
    return {
      overallBranchReportWriter: new ReportWriter<OverallBranchReportData>(this.getHeaderTitles(), this._outputDir, this.name, this.getExceptions())
    }
  }

  protected getHeaderTitles (): HeaderTitles<OverallBranchReportData> {
    return {
      repoName: 'Repo',
      branchName: 'Branch',
      teams: 'Admin Teams',
      admins: 'Admin Users',
      lastCommitDate: 'Last Commit Date',
      lastCommitAuthor: 'Last Commit User',
      lowNodeVersion: 'Lowest Node Version Across Any Branch',
      highNodeVersion: 'Highest Node Version Across Any Branch',
      lowTerraformVersion: 'Lowest Terraform Version Across Any Branch',
      highTerraformVersion: 'Highest Terraform Version Across Any Branch',
      lowPythonVersion: 'Highest Python Version Across Any Branch',
      highPythonVersion: 'Highest Python Version Across Any Branch',
      default: 'Default Branch?',
      stale: 'Stale Branch?',
      deployed: 'Deployed Branch?',
      protected: 'Protected Branch?',
      lastPushActionRunConclusion: 'Conclusion of the Push Last Action Run on this Branch',
      lastPushActionRunDate: 'Date of the Last Push Action Run on this Branch',
      lastSuccessfulPushActionRunDate: 'Date of the Last Successful Push Action Run on this Branch'
    }
  }

  public get name (): string {
    return OverallBranchReport.name
  }
}
