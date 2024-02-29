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
  protected async runReport (repo: Repo, writers: LowFileBranchReportWriters): Promise<void> {
    for (const branchName in repo.branches) {
      if (repo.branches[branchName].fileCount <= 5 && !repo.branches[branchName].dependabot) {
        writers.lowFileBranchReportWriter.addRow({
          repoName: repo.name,
          branch: branchName,
          fileCount: repo.branches[branchName].fileCount
        })
      }
    }
  }

  protected getReportWriters (): LowFileBranchReportWriters {
    return {
      lowFileBranchReportWriter: new ReportWriter(this.getHeaderTitles(), this._outputDir, this.name)
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