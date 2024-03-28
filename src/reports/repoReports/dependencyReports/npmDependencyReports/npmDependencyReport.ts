import {
  type Repo
} from '../../../../types'
import { errorHandler, HeaderTitles, ReportWriter } from '../../../../util'
import { DependencyReport, DependencyInstanceReportWriters, DependencyReportData } from '../dependencyReport'
import getNPMDependencyPartsFromFile from './getNPMDependencyPartsFromFile'

interface NPMDependencyReportData extends DependencyReportData {
  repoName: string
  branchName: string
  version: string
  fileName: string
}

export class NPMDependencyReport extends DependencyReport<NPMDependencyReportData> {
  protected async runReport (repo: Repo, writers: DependencyInstanceReportWriters<NPMDependencyReportData>): Promise<void> {
    for (const branchName in repo.branches) {
      try {
        for (const ruleFile of repo.branches[branchName].ruleFiles) {
          const depParts = getNPMDependencyPartsFromFile(ruleFile)
          for (const dep of depParts) {
            if (writers[dep.name] == null) {
              writers[dep.name] = new ReportWriter<NPMDependencyReportData>(this.getHeaderTitles(), this._outputDir, dep.name, this.getExceptions())
            }
            writers[dep.name].addRow({
              repoName: repo.name,
              branchName,
              version: dep.version,
              fileName: ruleFile.fileName
            })
          }
        }
      } catch (error) {
        errorHandler(error, NPMDependencyReport.name, repo.name, branchName)
      }
    }
  }

  protected getHeaderTitles (): HeaderTitles<NPMDependencyReportData> {
    return {
      repoName: 'Repo',
      branchName: 'Branch',
      version: 'Version',
      fileName: 'File Name'
    }
  }

  public get name (): string {
    return NPMDependencyReport.name
  }
}
