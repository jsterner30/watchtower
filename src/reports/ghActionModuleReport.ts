import {
  type RepoInfo,
  type ReportFunction,
  validGHAFile,
  FileTypeEnum, CSVWriterHeader
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'

export const ghActionModuleReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header: CSVWriterHeader = [
    { id: 'repoName', title: 'Repo' },
    { id: 'branchName', title: 'Branch' },
    { id: 'version', title: 'Version' }
  ]

  const actionModuleWriters: Record<string, ReportDataWriter> = {}

  for (const repo of repos) {
    for (const branchName in repo.branches) {
      for (const dep of repo.branches[branchName].deps) {
        if (validGHAFile.Check(dep) && dep.fileType === FileTypeEnum.GITHUB_ACTION) {
          if (dep.contents.jobs != null) {
            for (const jobName in dep.contents.jobs) {
              if (dep.contents.jobs[jobName].steps != null) {
                for (const step of dep.contents.jobs[jobName].steps) {
                  if (step.uses != null) {
                    const moduleString = step.uses.split('@')
                    if (moduleString[1] != null) {
                      const moduleName: string = moduleString[1]
                      const version = moduleString[0]
                      if (actionModuleWriters[moduleName] == null) {
                        actionModuleWriters[moduleName] = new ReportDataWriter(`./src/data/reports/GHAModules/${moduleName}.csv`, header)
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
    }
  }

  for (const writer in actionModuleWriters) {
    await actionModuleWriters[writer].write()
  }
}
