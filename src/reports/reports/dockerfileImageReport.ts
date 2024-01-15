import {
  type RepoInfo,
  validDockerfile,
  FileTypeEnum, Header, HealthScore, GradeEnum
} from '../../types'
import { errorHandler, getRelativeReportGrades, ReportOutputData } from '../../util'
import { Report } from '../report'
import { logger } from '../../util/logger'

export class DockerfileImageReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const header: Header = [
      { id: 'repoName', title: 'Repo' },
      { id: 'branchName', title: 'Branch' },
      { id: 'image', title: 'Image' },
      { id: 'version', title: 'Version' },
      { id: 'tag', title: 'Tag' }
    ]

    const imageReportOutputs: Record<string, ReportOutputData> = {}

    for (const repo of repos) {
      for (const branchName in repo.branches) {
        try {
          for (const dep of repo.branches[branchName].deps) {
            if (validDockerfile.Check(dep) && dep.fileType === FileTypeEnum.DOCKERFILE) {
              const imageArray = dep.image.split(':')
              const image = imageArray[0].replace(/\//g, '_') // slashes in image name will mess with file structure
              if (imageReportOutputs[image] == null) {
                imageReportOutputs[image] = new ReportOutputData(header, this._outputDir, image)
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

              imageReportOutputs[image].addRow({
                repoName: repo.name,
                branchName,
                image,
                version: version ?? '?',
                tag: tag ?? '?'
              })
            }
          }
        } catch (error) {
          errorHandler(error, DockerfileImageReport.name, repo.name, branchName)
        }
      }
    }

    getRelativeReportGrades(imageReportOutputs, repos, DockerfileImageReport.name, this._weight)

    for (const output in imageReportOutputs) {
      this._reportOutputs.push(imageReportOutputs[output])
    }
  }

  grade (input: unknown): HealthScore {
    logger.error('The DockerfileImageReport does not implement the grade method because it is a relative report')
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }
}
