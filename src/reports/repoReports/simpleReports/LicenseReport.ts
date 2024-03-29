import { type Repo } from '../../../types'
import { HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'

interface LicenseReportData extends RepoReportData {
  repoName: string
  hasLicense: boolean
  licenseType: string
}

interface LicenseReportWriters extends Writers<LicenseReportData> {
  licenseReportWriter: ReportWriter<LicenseReportData>
}

export class LicenseReport extends RepoReport<LicenseReportData, LicenseReportWriters> {
  protected async runReport (repo: Repo): Promise<void> {
    this._reportWriters.licenseReportWriter.addRow({
      repoName: repo.name,
      hasLicense: repo.licenseData.key !== 'none',
      licenseType: repo.licenseData.name
    })
  }

  protected getReportWriters (): LicenseReportWriters {
    return {
      licenseReportWriter: new ReportWriter<LicenseReportData>(this.getHeaderTitles(), this._outputDir, this.name, this.getExceptions())
    }
  }

  protected getHeaderTitles (): HeaderTitles<LicenseReportData> {
    return {
      repoName: 'Repo',
      hasLicense: 'Has License',
      licenseType: 'License Type'
    }
  }

  public get name (): string {
    return LicenseReport.name
  }
}
