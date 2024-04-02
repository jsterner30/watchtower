import {
  GradeEnum, HealthScore,
  type Repo
} from '../../../types'
import { HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'

interface LowFileRepoReportData extends RepoReportData {
  repoName: string
  fileCount: number
}

interface LowFileRepoReportWriters extends Writers<LowFileRepoReportData> {
  lowFileRepoReportWriter: ReportWriter<LowFileRepoReportData>
}

export class LowFileRepoReport extends RepoReport<LowFileRepoReportData, LowFileRepoReportWriters> {
  protected async runReport (repo: Repo): Promise<void> {
    let someBranchHasFiles = false
    for (const branchName in repo.branches) {
      if (repo.branches[branchName].fileCount > 5 && !repo.branches[branchName].dependabot) {
        someBranchHasFiles = true
      }
    }
    if (!someBranchHasFiles && Object.keys(repo.branches).length !== 0) {
      this._reportWriters.lowFileRepoReportWriter.addRow({
        repoName: repo.name,
        fileCount: repo.branches[repo.defaultBranch].fileCount
      })
    }

    repo.healthScores[LowFileRepoReport.name] = await this.grade({ someBranchHasFiles, numberBranches: Object.keys(repo.branches).length })
  }

  protected initReportWriters (): LowFileRepoReportWriters {
    return {
      lowFileRepoReportWriter: new ReportWriter<LowFileRepoReportData>(this.getHeaderTitles(), this._outputDir, this.name, this.getExceptions())
    }
  }

  protected getHeaderTitles (): HeaderTitles<LowFileRepoReportData> {
    return {
      repoName: 'Repo',
      fileCount: 'FileCount'
    }
  }

  protected async grade (input: { someBranchHasFiles: boolean, numberBranches: number }): Promise<HealthScore> {
    if (!input.someBranchHasFiles && input.numberBranches !== 0) {
      return {
        grade: GradeEnum.F,
        weight: this._weight
      }
    }

    return {
      grade: GradeEnum.A,
      weight: this._weight
    }
  }

  public get name (): string {
    return LowFileRepoReport.name
  }
}
