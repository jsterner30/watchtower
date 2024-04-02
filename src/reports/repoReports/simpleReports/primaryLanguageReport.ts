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
  protected async runReport (repo: Repo): Promise<void> {
    this._reportWriters.primaryLanguageReportWriter.addRow({
      repoName: repo.name,
      language: repo.language
    })
  }

  protected initReportWriters (): PrimaryLanguageReportWriters {
    return {
      primaryLanguageReportWriter: new ReportWriter<PrimaryLanguageReportData>(this.getHeaderTitles(), this._outputDir, this.name, this.getExceptions())
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
