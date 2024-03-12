import {
  type Repo
} from '../../../../types'
import { errorHandler, HeaderTitles, ReportWriter } from '../../../../util'
import { DependencyReport, DependencyInstanceReportWriters } from '../dependencyReport'
import { RepoReportData } from '../../repoReport'
import getTerraformModulePartsFromFile from './getTerraformModulePartsFromFile'

interface TerraformModuleReportData extends RepoReportData {
  repoName: string
  branchName: string
  version: string
}

export class TerraformModuleReport extends DependencyReport<TerraformModuleReportData> {
  protected async runReport (repo: Repo, writers: DependencyInstanceReportWriters<any>): Promise<void> {
    for (const branchName in repo.branches) {
      try {
        for (const ruleFile of repo.branches[branchName].ruleFiles) {
          const moduleParts = getTerraformModulePartsFromFile(ruleFile)
          for (const module of moduleParts) {
            if (writers[module.name] == null) {
              writers[module.name] = new ReportWriter(this.getHeaderTitles(), this._outputDir, module.name)
            }

            writers[module.name].addRow({
              repoName: repo.name,
              branchName,
              version: module.version
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
      version: 'Version'
    }
  }

  public get name (): string {
    return TerraformModuleReport.name
  }
}
