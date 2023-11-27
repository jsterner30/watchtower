import {
  type RepoInfo,
  type ReportFunction,
  FileTypeEnum, CSVWriterHeader, validPackageJsonFile
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'

export const npmDependencyReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header: CSVWriterHeader = [
    { id: 'repoName', title: 'Repo' },
    { id: 'branchName', title: 'Branch' },
    { id: 'version', title: 'version' }
  ]

  const dependencyReportWriters: Record<string, ReportDataWriter> = {}

  for (const repo of repos) {
    for (const branchName in repo.branches) {
      try {
        for (const dep of repo.branches[branchName].deps) {
          if (validPackageJsonFile.Check(dep) && dep.fileType === FileTypeEnum.PACKAGE_JSON) {
            for (const dependencyName in dep.dependencies) {
              if (dependencyReportWriters[dependencyName] == null) {
                dependencyReportWriters[dependencyName] = new ReportDataWriter(`./src/data/reports/NPMDependencies/${dependencyName}.csv`, header)
              }
              dependencyReportWriters[dependencyName].data.push({
                repoName: repo.name,
                branchName,
                version: dep.dependencies[dependencyName].version
              })
            }
          }
        }
      } catch (error) {
        errorHandler(error, npmDependencyReport.name, repo.name, branchName)
      }
    }
  }

  for (const writer in dependencyReportWriters) {
    await dependencyReportWriters[writer].write()
  }
}
