import {
  type RepoInfo,
  type ReportFunction,
  validGHAFile,
  FileTypeEnum, CSVWriterHeader
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler, getRelativeReportGrades } from '../util'
import {ghActionModuleReportGradeName, ghActionModuleReportGradeWeight} from '../util/constants'

export const ghActionModuleReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header: CSVWriterHeader = [
    { id: 'repoName', title: 'Repo' },
    { id: 'branchName', title: 'Branch' },
    { id: 'version', title: 'Version' }
  ]

  const actionModuleWriters: Record<string, ReportDataWriter> = {}

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
                        if (actionModuleWriters[moduleName] == null) {
                          actionModuleWriters[moduleName] = new ReportDataWriter(`./data/reports/GHAModules/${moduleName}.csv`, header)
                        }

                        actionModuleWriters[moduleName].data.push({
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
        errorHandler(error, ghActionModuleReport.name, repo.name, branchName)
      }
    }
  }

  getRelativeReportGrades(actionModuleWriters, repos, ghActionModuleReportGradeName, ghActionModuleReportGradeWeight)

  for (const writer in actionModuleWriters) {
    await actionModuleWriters[writer].write()
  }
}
