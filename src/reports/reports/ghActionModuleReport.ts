import {
  type RepoInfo,
  validGHAFile,
  FileTypeEnum, Header, HealthScore, GradeEnum
} from '../../types'
import { errorHandler, getRelativeReportGrades, ReportOutputData } from '../../util'
import { Report } from '../report'
import { logger } from '../../util/logger'

export class GhActionModuleReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const header: Header = [
      { id: 'repoName', title: 'Repo' },
      { id: 'branchName', title: 'Branch' },
      { id: 'version', title: 'Version' }
    ]

    const actionModuleOutputs: Record<string, ReportOutputData> = {}

    for (const repo of repos) {
      for (const branchName in repo.branches) {
        try {
          for (const dep of repo.branches[branchName].deps) {
            if (validGHAFile.Check(dep) && dep.fileType === FileTypeEnum.GITHUB_ACTION) {
              if (dep.contents.jobs != null) {
                for (const jobName in dep.contents.jobs) {
                  if (dep.contents.jobs[jobName].steps != null) {
                    for (const step of dep.contents.jobs[jobName].steps) {
                      if (step.uses != null) {
                        const moduleString = step.uses.split('@')
                        if (moduleString[1] != null) {
                          const moduleName: string = moduleString[0].replace(/\//g, '_') // slashes or action name will mess with file structure
                          const version = moduleString[1]
                          if (actionModuleOutputs[moduleName] == null) {
                            actionModuleOutputs[moduleName] = new ReportOutputData(header, this._outputDir, moduleName)
                          }

                          actionModuleOutputs[moduleName].addRow({
                            repoName: repo.name,
                            branchName,
                            version
                          })
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          errorHandler(error, GhActionModuleReport.name, repo.name, branchName)
        }
      }
    }

    getRelativeReportGrades(actionModuleOutputs, repos, GhActionModuleReport.name, this._weight)

    for (const output in actionModuleOutputs) {
      this._reportOutputs.push(actionModuleOutputs[output])
    }
  }

  grade (input: unknown): HealthScore {
    logger.error('The GhActionModuleReport does not implement the grade method because it is a relative report')
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }

  public get name (): string {
    return GhActionModuleReport.name
  }
}
