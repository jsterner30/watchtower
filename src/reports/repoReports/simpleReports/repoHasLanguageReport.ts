import {
  type Repo
} from '../../../types'
import { extensionLanguageMap, HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'
import { WritableSet } from '../../../util/writable'

interface RepoHasLanguageReportData extends RepoReportData {
  repoName: string
  languages: WritableSet<string>
}
interface FileTypeWriters extends Writers<RepoHasLanguageReportData> {
  repoHasLanguageReportWriter: ReportWriter<RepoHasLanguageReportData>
}

export class RepoHasLanguageReport extends RepoReport<RepoHasLanguageReportData, FileTypeWriters> {
  private readonly fileExtensionMap = extensionLanguageMap()

  protected async runReport (repo: Repo): Promise<void> {
    const repoLanguageList = new WritableSet<string>()
    for (const branchName in repo.branches) {
      for (const extension in repo.branches[branchName].fileTypes) {
        if (this.fileExtensionMap[extension] != null) {
          repoLanguageList.add(this.fileExtensionMap[extension])
        }
      }
    }
    this._reportWriters.repoHasLanguageReportWriter.addRow({ repoName: repo.name, languages: repoLanguageList })
  }

  protected getHeaderTitles (): HeaderTitles<RepoHasLanguageReportData> {
    return {
      repoName: 'Repo',
      languages: 'Languages Found in Repo'
    }
  }

  protected initReportWriters (): FileTypeWriters {
    const header = this.getHeaderTitles()
    return {
      repoHasLanguageReportWriter: new ReportWriter<RepoHasLanguageReportData>(header, this._outputDir, this.name, this.getExceptions())
    }
  }

  public get name (): string {
    return RepoHasLanguageReport.name
  }
}
