import { type Repo } from '../../../../types'
import { errorHandler, HeaderTitles } from '../../../../util'
import { DependencyReport, DependencyReportData } from '../dependencyReport'
import getTerraformModulePartsFromFile from './getTerraformModulePartsFromFile'

interface TerraformModuleReportData extends DependencyReportData {
  depName: string
  repoName: string
  branchName: string
  version: string
  fileName: string
}

export class TerraformModuleReport extends DependencyReport<TerraformModuleReportData> {
  protected async runReport (repo: Repo): Promise<void> {
    for (const branchName in repo.branches) {
      try {
        for (const ruleFile of repo.branches[branchName].ruleFiles) {
          const moduleParts = getTerraformModulePartsFromFile(ruleFile)
          for (const module of moduleParts) {
            this.getReportWriters().dependencyReportWriter.addRow({
              depName: module.name,
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

  protected getHeaderTitles (): HeaderTitles<TerraformModuleReportData> {
    return {
      depName: 'Module Name',
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
