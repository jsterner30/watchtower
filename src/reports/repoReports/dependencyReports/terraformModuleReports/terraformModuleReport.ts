import { type Repo } from '../../../../types'
import { errorHandler, HeaderTitles, ReportWriter } from '../../../../util'
import { DependencyReport, DependencyInstanceReportWriters, DependencyReportData } from '../dependencyReport'
import getTerraformModulePartsFromFile from './getTerraformModulePartsFromFile'

interface TerraformModuleReportData extends DependencyReportData {
  repoName: string
  branchName: string
  version: string
  fileName: string
}

export class TerraformModuleReport extends DependencyReport<TerraformModuleReportData> {
  protected async runReport (repo: Repo, writers: DependencyInstanceReportWriters<TerraformModuleReportData>): Promise<void> {
    for (const branchName in repo.branches) {
      try {
        for (const ruleFile of repo.branches[branchName].ruleFiles) {
          const moduleParts = getTerraformModulePartsFromFile(ruleFile)
          for (const module of moduleParts) {
            if (writers[module.name] == null) {
              writers[module.name] = new ReportWriter<TerraformModuleReportData>(this.getHeaderTitles(), this._outputDir, module.name)
            }

            writers[module.name].addRow({
              repoName: repo.name,
              branchName,
              version: module.version,
              fileName: ruleFile.fileName
            })
          }
        }
      } catch (error) {
        errorHandler(error, TerraformModuleReport.name, repo.name, branchName)
      }
    }
  }

  protected getHeaderTitles (): HeaderTitles<any> {
    return {
      repoName: 'Repo',
      branchName: 'Branch',
      version: 'Version',
      fileName: 'File Name'
    }
  }

  public get name (): string {
    return TerraformModuleReport.name
  }
}
