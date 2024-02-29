import {
  type Repo,
  FileTypeEnum,
  validPIPRequirementsFile
} from '../../../types'
import { errorHandler, HeaderTitles, removeComparatorsInVersion, ReportWriter } from '../../../util'
import { DependencyReport, DependencyReportWriters } from './dependencyReport'
import { RepoReportData } from '../repoReport'

interface PIPDependencyReportData extends RepoReportData {
  repoName: string
  branchName: string
  version: string
}

export class PIPDependencyReport extends DependencyReport<PIPDependencyReportData> {
  protected async runReport (repo: Repo, writers: DependencyReportWriters<PIPDependencyReportData>): Promise<void> {
    for (const branchName in repo.branches) {
      try {
        for (const dep of repo.branches[branchName].deps) {
          if (validPIPRequirementsFile.Check(dep) && dep.fileType === FileTypeEnum.PIP_REQUIREMENTS) {
            for (const name in dep.dependencies) {
              const dependencyName = name.replace(/\//g, '_') // slashes in dep name will mess with file structure
              if (writers[dependencyName] == null) {
                writers[dependencyName] = new ReportWriter(this.getHeaderTitles(), this._outputDir, dependencyName)
              }
              writers[dependencyName].addRow({
                repoName: repo.name,
                branchName,
                version: removeComparatorsInVersion(dep.dependencies[name].version)
              })
            }
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
