import {
  type Repo
} from '../../../types'
import { HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'
import { WriteableMap } from '../../../util/writable'

interface DefaultBranchFileTypesReportData extends RepoReportData {
  repoName: string
  percentageList: WriteableMap<number>
}
interface DefaultBranchFileTypeWriters extends Writers<DefaultBranchFileTypesReportData> {
  defaultBranchFileTypesReport: ReportWriter<DefaultBranchFileTypesReportData>
}

export class DefaultBranchFileTypesReport extends RepoReport<DefaultBranchFileTypesReportData, DefaultBranchFileTypeWriters> {
  protected async runReport (repo: Repo): Promise<void> {
    for (const branchName in repo.branches) {
      if (repo.branches[branchName].defaultBranch) {
        const fileTypes = repo.branches[branchName].fileTypes

        // Calculate total files
        const totalFiles = Object.values(fileTypes).reduce((acc, count) => acc + count, 0)

        const map = new WriteableMap<number>()
        for (const fileType in fileTypes) {
          map.set(fileType, fileTypes[fileType] / totalFiles)
        }

        this._reportWriters.defaultBranchFileTypesReport.addRow({
          repoName: repo.name,
          percentageList: map
        })
      }
    }
  }

  protected getHeaderTitles (): HeaderTitles<DefaultBranchFileTypesReportData> {
    return {
      repoName: 'Repo',
      percentageList: 'Percentage List'
    }
  }

  protected getReportWriters (): DefaultBranchFileTypeWriters {
    return {
      defaultBranchFileTypesReport: new ReportWriter<DefaultBranchFileTypesReportData>(this.getHeaderTitles(), this._outputDir, this.name, this.getExceptions())
    }
  }

  public get name (): string {
    return DefaultBranchFileTypesReport.name
  }
}
