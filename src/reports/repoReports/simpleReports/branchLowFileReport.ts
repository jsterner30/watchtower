import type {
  Repo
} from '../../../types'
import { HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'

interface BranchLowFileReportData extends RepoReportData {
  repoName: string
  branch: string
  fileCount: number
}

interface BranchLowFileReportWriters extends Writers<BranchLowFileReportData> {
  branchLowFileReportWriter: ReportWriter<BranchLowFileReportData>
}

export class BranchLowFilesReport extends RepoReport<BranchLowFileReportData, BranchLowFileReportWriters> {
  protected async runReport (repo: Repo, writers: BranchLowFileReportWriters): Promise<void> {
    for (const branchName in repo.branches) {
      if (repo.branches[branchName].fileCount < 5 && !repo.branches[branchName].dependabot) {
        writers.branchLowFileReportWriter.addRow({
          repoName: repo.name,
          branch: branchName,
          fileCount: repo.branches[branchName].fileCount
        })
      }
    }
  }

  protected getReportWriters (): BranchLowFileReportWriters {
    return {
      branchLowFileReportWriter: new ReportWriter(this.getHeaderTitles(), this._outputDir, this.name)
    }
  }

  protected getHeaderTitles (): HeaderTitles<BranchLowFileReportData> {
    return {
      repoName: 'Repo',
      branch: 'Branch',
      fileCount: 'FileCount'
    }
  }

  public get name (): string {
    return BranchLowFilesReport.name
  }
}
