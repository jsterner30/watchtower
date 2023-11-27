import {
  type RepoInfo,
  type ReportFunction,
  validDockerfile,
  FileTypeEnum, CSVWriterHeader
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'

export const dockerfileImageReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header: CSVWriterHeader = [
    { id: 'repoName', title: 'Repo' },
    { id: 'branchName', title: 'Branch' },
    { id: 'image', title: 'Image' }
  ]

  const imageReportWriters: Record<string, ReportDataWriter> = {}

  for (const repo of repos) {
    for (const branchName in repo.branches) {
      try {
        for (const dep of repo.branches[branchName].deps) {
          if (validDockerfile.Check(dep) && dep.fileType === FileTypeEnum.DOCKERFILE) {
            const image = dep.image.replace(/\//g, '_') // slashes in image name will mess with file structure
            if (imageReportWriters[dep.image] == null) {
              imageReportWriters[dep.image] = new ReportDataWriter(`./src/data/reports/dockerfileImages/${image}.csv`, header)
            }
            imageReportWriters[dep.image].data.push({
              repoName: repo.name, image
            })
          }
        }
      } catch (error) {
        errorHandler(error, dockerfileImageReport.name, repo.name, branchName)
      }
    }
  }

  for (const writer in imageReportWriters) {
    await imageReportWriters[writer].write()
  }
}
