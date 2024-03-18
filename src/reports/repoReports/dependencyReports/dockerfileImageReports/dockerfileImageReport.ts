import {
  type Repo
} from '../../../../types'
import { errorHandler, HeaderTitles, ReportWriter } from '../../../../util'
import { DependencyReport, DependencyInstanceReportWriters, DependencyReportData } from './../dependencyReport'
import getImagePartsFromFile from './getImagePartsFromFile'

export interface DockerfileImageReportData extends DependencyReportData {
  repoName: string
  branchName: string
  image: string
  version: string
  tag: string
  fileName: string
}

export class DockerfileImageReport extends DependencyReport<DockerfileImageReportData> {
  protected async runReport (repo: Repo, writers: DependencyInstanceReportWriters<DockerfileImageReportData>): Promise<void> {
    for (const branchName in repo.branches) {
      try {
        for (const ruleFile of repo.branches[branchName].ruleFiles) {
          const imageParts = getImagePartsFromFile(ruleFile)
          if (imageParts != null) {
            const { image, version, tag } = imageParts
            if (writers[image] == null) {
              writers[image] = new ReportWriter(this.getHeaderTitles(), this._outputDir, image)
            }

            writers[image].addRow({
              repoName: repo.name,
              branchName,
              image,
              version,
              tag,
              fileName: ruleFile.fileName
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
      tag: 'Tag',
      fileName: 'File Name'
    }
  }

  public get name (): string {
    return DockerfileImageReport.name
  }
}
