import {
  type Repo,
  validDockerfile,
  FileTypeEnum
} from '../../../types'
import { errorHandler, HeaderTitles, ReportWriter } from '../../../util'
import { DependencyReport, DependencyReportWriters } from './dependencyReport'
import { RepoReportData } from '../repoReport'

export interface DockerfileImageReportData extends RepoReportData {
  repoName: string
  branchName: string
  image: string
  version: string
  tag: string
}
export class DockerfileImageReport extends DependencyReport<DockerfileImageReportData> {
  protected async runReport (repo: Repo, writers: DependencyReportWriters<DockerfileImageReportData>): Promise<void> {
    for (const branchName in repo.branches) {
      try {
        for (const dep of repo.branches[branchName].deps) {
          if (validDockerfile.Check(dep) && dep.fileType === FileTypeEnum.DOCKERFILE) {
            const imageArray = dep.image.split(':')
            const image = imageArray[0].replace(/\//g, '_') // slashes in image name will mess with file structure
            if (writers[image] == null) {
              writers[image] = new ReportWriter(this.getHeaderTitles(), this._outputDir, image)
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

            writers[image].addRow({
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

  protected getHeaderTitles (): HeaderTitles<DockerfileImageReportData> {
    return {
      repoName: 'Repo',
      branchName: 'Branch',
      image: 'Image',
      version: 'Version',
      tag: 'Tag'
    }
  }

  public get name (): string {
    return DockerfileImageReport.name
  }
}
