import {
  type Repo
} from '../../../../types'
import { errorHandler, HeaderTitles } from '../../../../util'
import { DependencyReport, DependencyReportData } from '../dependencyReport'
import getPIPDependencyPartsFromFile from './getPIPDependencyPartsFromFile'

interface PIPDependencyReportData extends DependencyReportData {
  depName: string
  repoName: string
  branchName: string
  version: string
  fileName: string
}

export class PIPDependencyReport extends DependencyReport<PIPDependencyReportData> {
  protected async runReport (repo: Repo): Promise<void> {
    for (const branchName in repo.branches) {
      try {
        for (const ruleFile of repo.branches[branchName].ruleFiles) {
          const depParts = getPIPDependencyPartsFromFile(ruleFile)
          for (const dep of depParts) {
            this.getReportWriters().dependencyReportWriter.addRow({
              depName: dep.name,
              repoName: repo.name,
              branchName,
              version: dep.version,
              fileName: ruleFile.fileName
            })
          }
        }
      } catch (error) {
        errorHandler(error, PIPDependencyReport.name, repo.name, branchName)
      }
    }
  }

  protected getHeaderTitles (): HeaderTitles<PIPDependencyReportData> {
    return {
      depName: 'Dependency Name',
      repoName: 'Repo',
      branchName: 'Branch',
      version: 'Version',
      fileName: 'File Name'
    }
  }

  public get name (): string {
    return PIPDependencyReport.name
  }
}
