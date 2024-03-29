import { FileTypeEnum, type Repo, validOpenAPIFile } from '../../../types'
import { anyStringRegex, Exception, HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'
import { WriteableRegExp } from '../../../util/writable'

interface OpenAPIReportData extends RepoReportData {
  repoName: string
  openAPIFilePath: string
}

interface OpenAPIReportWriter extends Writers<OpenAPIReportData> {
  openAPIFileReport: ReportWriter<OpenAPIReportData>
}

export class OpenAPIReport extends RepoReport<OpenAPIReportData, OpenAPIReportWriter> {
  protected async runReport (repo: Repo): Promise<void> {
    for (const ruleFile of repo.branches[repo.defaultBranch].ruleFiles) {
      if (validOpenAPIFile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.OPEN_API) {
        this._reportWriters.openAPIFileReport.addRow({
          repoName: repo.name,
          openAPIFilePath: ruleFile.fileName
        })
      }
    }
  }

  protected getReportWriters (): OpenAPIReportWriter {
    return {
      openAPIFileReport: new ReportWriter<OpenAPIReportData>(this.getHeaderTitles(), this._outputDir, this.name, this.getExceptions())
    }
  }

  protected getHeaderTitles (): HeaderTitles<OpenAPIReportData> {
    return {
      repoName: 'Repo',
      openAPIFilePath: 'File Path of OpenAPI File on Default Branch'
    }
  }

  protected getExceptions (): Array<Exception<OpenAPIReportData>> {
    return [{
      repoName: new WriteableRegExp(/tyk-api-definitions/),
      openAPIFilePath: anyStringRegex
    }]
  }

  public get name (): string {
    return OpenAPIReport.name
  }
}
