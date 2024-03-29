import type {
  Repo
} from '../../../types'
import { HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'

interface LowFileBranchReportData extends RepoReportData {
  repoName: string
  branch: string
  fileCount: number
}

interface LowFileBranchReportWriters extends Writers<LowFileBranchReportData> {
  lowFileBranchReportWriter: ReportWriter<LowFileBranchReportData>
}

export class LowFileBranchReport extends RepoReport<LowFileBranchReportData, LowFileBranchReportWriters> {
  protected async runReport (repo: Repo): Promise<void> {
    for (const branchName in repo.branches) {
      if (repo.branches[branchName].fileCount <= 5 && !repo.branches[branchName].dependabot) {
        this._reportWriters.lowFileBranchReportWriter.addRow({
          repoName: repo.name,
          branch: branchName,
          fileCount: repo.branches[branchName].fileCount
        })
      }
    }
  }

  protected getReportWriters (): LowFileBranchReportWriters {
    return {
      lowFileBranchReportWriter: new ReportWriter<LowFileBranchReportData>(this.getHeaderTitles(), this._outputDir, this.name, this.getExceptions())
    }
  }

  protected getHeaderTitles (): HeaderTitles<LowFileBranchReportData> {
    return {
      repoName: 'Repo',
      branch: 'Branch',
      fileCount: 'FileCount'
    }
  }

  public get name (): string {
    return LowFileBranchReport.name
  }
}
