import { type Repo } from '../../../types'
import { HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'

interface OpenAPIReportData extends RepoReportData {
  repoName: string
  openAPIFilePath: string
}

interface OpenAPIReportWriter extends Writers<OpenAPIReportData> {
  openAPIFileReport: ReportWriter<OpenAPIReportData>
}

export class OpenAPIReport extends RepoReport<OpenAPIReportData, OpenAPIReportWriter> {
  protected async runReport (repo: Repo, writers: Writers<OpenAPIReportData>): Promise<void> {
    for (const ruleFile of repo.branches[repo.defaultBranch].ruleFiles) {
      writers.openAPIFileReport.addRow({
        repoName: repo.name,
        openAPIFilePath: ruleFile.fileName
      })
    }
  }

  protected getReportWriters (): OpenAPIReportWriter {
    return {
      openAPIFileReport: new ReportWriter<OpenAPIReportData>(this.getHeaderTitles(), this._outputDir, this.name)
    }
  }

  protected getHeaderTitles (): HeaderTitles<OpenAPIReportData> {
    return {
      repoName: 'Repo',
      openAPIFilePath: 'File Path of OpenAPI File on Default Branch'
    }
  }

  public get name (): string {
    return OpenAPIReport.name
  }
}
