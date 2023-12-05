import {
  type RepoInfo,
  type ReportFunction,
  validDockerfile,
  FileTypeEnum, CSVWriterHeader
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler, getRelativeReportGrades } from '../util'
import {dockerfileImageReportGradeName, dockerfileImageReportGradeWeight} from '../util/constants'

export const dockerfileImageReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header: CSVWriterHeader = [
    { id: 'repoName', title: 'Repo' },
    { id: 'branchName', title: 'Branch' },
    { id: 'image', title: 'Image' },
    { id: 'version', title: 'Version' },
    { id: 'tag', title: 'Tag' }
  ]

  const imageReportWriters: Record<string, ReportDataWriter> = {}

  for (const repo of repos) {
    for (const branchName in repo.branches) {
      try {
        for (const dep of repo.branches[branchName].deps) {
          if (validDockerfile.Check(dep) && dep.fileType === FileTypeEnum.DOCKERFILE) {
            const imageArray = dep.image.split(':')
            const image = imageArray[0].replace(/\//g, '_') // slashes in image name will mess with file structure
            if (imageReportWriters[image] == null) {
              imageReportWriters[image] = new ReportDataWriter(`./data/reports/dockerfileImages/${image}.csv`, header)
            }
            let version = null
            let tag = null

            if (imageArray[1] != null) {
              const versionArray = imageArray[1].split('-')
              version = versionArray[0]
              if (versionArray[1] != null) {
                tag = versionArray[1]
              }
            }

            imageReportWriters[image].data.push({
              repoName: repo.name,
              branchName,
              image,
              version: version ?? '?',
              tag: tag ?? '?'
            })
          }
        }
      } catch (error) {
        errorHandler(error, dockerfileImageReport.name, repo.name, branchName)
      }
    }
  }

  getRelativeReportGrades(imageReportWriters, repos, dockerfileImageReportGradeName, dockerfileImageReportGradeWeight)

  for (const writer in imageReportWriters) {
    await imageReportWriters[writer].write()
  }
}
