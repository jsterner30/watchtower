import {
  type RepoInfo,
  FileTypeEnum, Header, validPackageJsonFile, HealthScore, GradeEnum
} from '../../types'
import { errorHandler, getRelativeReportGrades, removeComparatorsInVersion, ReportOutputData } from '../../util'
import { Report } from '../report'
import { logger } from '../../util/logger'

export class NPMDependencyReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const header: Header = [
      { id: 'repoName', title: 'Repo' },
      { id: 'branchName', title: 'Branch' },
      { id: 'version', title: 'version' }
    ]

    const dependencyReportOutput: Record<string, ReportOutputData> = {}

    for (const repo of repos) {
      for (const branchName in repo.branches) {
        try {
          for (const dep of repo.branches[branchName].deps) {
            if (validPackageJsonFile.Check(dep) && dep.fileType === FileTypeEnum.PACKAGE_JSON) {
              for (const name in dep.dependencies) {
                const dependencyName = name.replace(/\//g, '_') // slashes in dep name will mess with file structure
                if (dependencyReportOutput[dependencyName] == null) {
                  dependencyReportOutput[dependencyName] = new ReportOutputData(header, this._outputDir, dependencyName)
                }
                dependencyReportOutput[dependencyName].addRow({
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

    getRelativeReportGrades(dependencyReportOutput, repos, NPMDependencyReport.name, this._weight)

    for (const output in dependencyReportOutput) {
      this._reportOutputs.push(dependencyReportOutput[output])
    }
  }

  grade (input: unknown): HealthScore {
    logger.error('The NPMDependencyReport does not implement the grade method because it is a relative report')
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }

  public get name (): string {
    return NPMDependencyReport.name
  }
}
