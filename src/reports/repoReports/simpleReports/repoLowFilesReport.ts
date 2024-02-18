import {
  GradeEnum, HealthScore,
  type Repo
} from '../../../types'
import { HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'

interface RepoLowFileReportData extends RepoReportData {
  repoName: string
  fileCount: number
}

interface RepoLowFileReportWriters extends Writers<RepoLowFileReportData> {
  repoLowFileReportWriter: ReportWriter<RepoLowFileReportData>
}

export class RepoLowFilesReport extends RepoReport<RepoLowFileReportData, RepoLowFileReportWriters> {
  protected async runReport (repo: Repo, writers: RepoLowFileReportWriters): Promise<void> {
    let someBranchHasFiles = false
    for (const branchName in repo.branches) {
      if (repo.branches[branchName].fileCount > 5 && !repo.branches[branchName].dependabot) {
        someBranchHasFiles = true
      }
    }
    if (!someBranchHasFiles && Object.keys(repo.branches).length !== 0) {
      writers.repoLowFileReportWriter.addRow({
        repoName: repo.name,
        fileCount: repo.branches[repo.defaultBranch].fileCount
      })
    }

    repo.healthScores[RepoLowFilesReport.name] = await this.grade({ someBranchHasFiles, numberBranches: Object.keys(repo.branches).length })
  }

  protected getReportWriters (): RepoLowFileReportWriters {
    return {
      repoLowFileReportWriter: new ReportWriter(this.getHeaderTitles(), this._outputDir, this.name)
    }
  }

  protected getHeaderTitles (): HeaderTitles<RepoLowFileReportData> {
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
    return RepoLowFilesReport.name
  }
}
