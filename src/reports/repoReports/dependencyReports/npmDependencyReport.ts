import {
  type Repo,
  FileTypeEnum, validPackageJsonFile
} from '../../../types'
import { errorHandler, HeaderTitles, removeComparatorsInVersion, ReportWriter } from '../../../util'
import { DependencyReport, DependencyReportWriters } from './dependencyReport'
import { RepoReportData } from '../repoReport'

interface NPMDependencyReportData extends RepoReportData {
  repoName: string
  branchName: string
  version: string
}

export class NPMDependencyReport extends DependencyReport<NPMDependencyReportData> {
  protected async runReport (repo: Repo, writers: DependencyReportWriters<NPMDependencyReportData>): Promise<void> {
    for (const branchName in repo.branches) {
      try {
        for (const dep of repo.branches[branchName].deps) {
          if (validPackageJsonFile.Check(dep) && dep.fileType === FileTypeEnum.PACKAGE_JSON) {
            for (const name in dep.dependencies) {
              const dependencyName = name.replace(/\//g, '_') // slashes in dep name will mess with file structure
              if (writers[dependencyName] == null) {
                writers[dependencyName] = new ReportWriter(this.getHeaderTitles(), this._outputDir, dependencyName)
              }
              writers[dependencyName].addRow({
                repoName: repo.name,
                branchName,
                version: removeComparatorsInVersion(dep.dependencies[name])
              })
            }
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
      version: 'Version'
    }
  }

  public get name (): string {
    return NPMDependencyReport.name
  }
}
