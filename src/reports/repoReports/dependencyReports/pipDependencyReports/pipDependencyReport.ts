import {
  type Repo
} from '../../../../types'
import { errorHandler, HeaderTitles, ReportWriter } from '../../../../util'
import { DependencyReport, DependencyInstanceReportWriters } from '../dependencyReport'
import { RepoReportData } from '../../repoReport'
import getPIPDependencyPartsFromFile from './getPIPDependencyPartsFromFile'

interface PIPDependencyReportData extends RepoReportData {
  repoName: string
  branchName: string
  version: string
}

export class PIPDependencyReport extends DependencyReport<PIPDependencyReportData> {
  protected async runReport (repo: Repo, writers: DependencyInstanceReportWriters<PIPDependencyReportData>): Promise<void> {
    for (const branchName in repo.branches) {
      try {
        for (const ruleFile of repo.branches[branchName].ruleFiles) {
          const depParts = getPIPDependencyPartsFromFile(ruleFile)
          for (const dep of depParts) {
            if (writers[dep.name] == null) {
              writers[dep.name] = new ReportWriter(this.getHeaderTitles(), this._outputDir, dep.name)
            }
            writers[dep.name].addRow({
              repoName: repo.name,
              branchName,
              version: dep.version
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
      repoName: 'Repo',
      branchName: 'Branch',
      version: 'Version'
    }
  }

  public get name (): string {
    return PIPDependencyReport.name
  }
}
