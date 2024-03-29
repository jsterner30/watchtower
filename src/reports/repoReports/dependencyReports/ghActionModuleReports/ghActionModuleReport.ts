import {
  type Repo
} from '../../../../types'
import { errorHandler, HeaderTitles, ReportWriter } from '../../../../util'
import { DependencyReport } from '../dependencyReport'
import { RepoReportData } from '../../repoReport'
import getGhActionModulePartsFromFile from './getGhActionModulePartsFromFile'

interface GHActionModuleReportData extends RepoReportData {
  repoName: string
  branchName: string
  version: string
  fileName: string
}

export class GHActionModuleReport extends DependencyReport<GHActionModuleReportData> {
  protected async runReport (repo: Repo): Promise<void> {
    for (const branchName in repo.branches) {
      try {
        for (const ruleFile of repo.branches[branchName].ruleFiles) {
          const moduleParts = getGhActionModulePartsFromFile(ruleFile)
          for (const module of moduleParts) {
            if (this._reportWriters[module.name] == null) {
              this._reportWriters[module.name] = new ReportWriter<GHActionModuleReportData>(this.getHeaderTitles(), this._outputDir, module.name, this.getExceptions())
            }

            this._reportWriters[module.name].addRow({
              repoName: repo.name,
              branchName,
              version: module.version,
              fileName: ruleFile.fileName
            })
          }
        }
      } catch (error) {
        errorHandler(error, GHActionModuleReport.name, repo.name, branchName)
      }
    }
  }

  protected getHeaderTitles (): HeaderTitles<GHActionModuleReportData> {
    return {
      repoName: 'Repo',
      branchName: 'Branch',
      version: 'Version',
      fileName: 'File Name'
    }
  }

  public get name (): string {
    return GHActionModuleReport.name
  }
}
