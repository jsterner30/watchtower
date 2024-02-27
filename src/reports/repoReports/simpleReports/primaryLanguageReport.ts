import {
  type Repo
} from '../../../types'
import { HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'

interface PrimaryLanguageReportData extends RepoReportData {
  repoName: string
  language: string
}

interface PrimaryLanguageReportWriters extends Writers<PrimaryLanguageReportData> {
  primaryLanguageReportWriter: ReportWriter<PrimaryLanguageReportData>
}

export class PrimaryLanguageReport extends RepoReport<PrimaryLanguageReportData, PrimaryLanguageReportWriters> {
  protected async runReport (repo: Repo, writers: Writers<PrimaryLanguageReportData>): Promise<void> {
    writers.primaryLanguageReportWriter.addRow({
      repoName: repo.name,
      language: repo.language
    })
  }

  protected getReportWriters (): PrimaryLanguageReportWriters {
    return {
      primaryLanguageReportWriter: new ReportWriter(this.getHeaderTitles(), this._outputDir, this.name)
    }
  }

  protected getHeaderTitles (): HeaderTitles<PrimaryLanguageReportData> {
    return {
      repoName: 'Repo',
      language: 'Language'
    }
  }

  public get name (): string {
    return PrimaryLanguageReport.name
  }
}
