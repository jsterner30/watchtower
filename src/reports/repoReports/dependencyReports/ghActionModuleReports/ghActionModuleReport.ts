import {
  type Repo
} from '../../../../types'
import { errorHandler, HeaderTitles } from '../../../../util'
import { DependencyReport, DependencyReportData } from '../dependencyReport'
import getGhActionModulePartsFromFile from './getGhActionModulePartsFromFile'

interface GHActionModuleReportData extends DependencyReportData {
  depName: string
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
        errorHandler(error, GHActionModuleReport.name, repo.name, branchName)
      }
    }
  }

  protected getHeaderTitles (): HeaderTitles<GHActionModuleReportData> {
    return {
      depName: 'Module Name',
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
