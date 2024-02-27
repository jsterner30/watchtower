import {
  type Repo
} from '../../../types'
import { HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'

interface FileTypesReportData extends RepoReportData {
  repoName: string
  percentageList: string
}
interface FileTypeWriters extends Writers<FileTypesReportData> {
  defaultBranchFileTypesReport: ReportWriter<FileTypesReportData>
}

export class DefaultBranchFileTypesReport extends RepoReport<FileTypesReportData, FileTypeWriters> {
  protected async runReport (repo: Repo, writers: FileTypeWriters): Promise<void> {
    for (const branchName in repo.branches) {
      if (repo.branches[branchName].defaultBranch) {
        const fileTypes = repo.branches[branchName].fileTypes

        // Calculate total files
        const totalFiles = Object.values(fileTypes).reduce((acc, count) => acc + count, 0)

        // Create CSV-formatted string from percentage JSON
        const csvString = Object.entries(fileTypes)
          .map(([extension, count]) => `${extension}:${count / totalFiles}`)
          .join(',')

        // Create a report row
        writers.defaultBranchFileTypesReport.addRow({
          repoName: repo.name,
          percentageList: csvString
        })
      }
    }
  }

  protected getHeaderTitles (): HeaderTitles<FileTypesReportData> {
    return {
      repoName: 'Repo',
      percentageList: 'Percentage List'
    }
  }

  protected getReportWriters (): FileTypeWriters {
    return {
      defaultBranchFileTypesReport: new ReportWriter<FileTypesReportData>(this.getHeaderTitles(), this._outputDir, this.name)
    }
  }

  public get name (): string {
    return DefaultBranchFileTypesReport.name
  }
}
