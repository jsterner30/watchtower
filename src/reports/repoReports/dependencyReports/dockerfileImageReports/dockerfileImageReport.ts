import {
  type Repo
} from '../../../../types'
import { errorHandler, HeaderTitles } from '../../../../util'
import { DependencyReport, DependencyReportData } from '../dependencyReport'
import getImagePartsFromFile from './getImagePartsFromFile'

export interface DockerfileImageReportData extends DependencyReportData {
  depName: string
  repoName: string
  branchName: string
  image: string
  tag: string
  version: string
  fileName: string
}

export class DockerfileImageReport extends DependencyReport<DockerfileImageReportData> {
  protected async runReport (repo: Repo): Promise<void> {
    for (const branchName in repo.branches) {
      try {
        for (const ruleFile of repo.branches[branchName].ruleFiles) {
          const imageParts = getImagePartsFromFile(ruleFile)
          if (imageParts != null) {
            const { image, version, tag } = imageParts

            this._reportWriters.dependencyReportWriter.addRow({
              depName: image,
              repoName: repo.name,
              branchName,
              image,
              tag,
              version,
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
      depName: 'Image Name',
      repoName: 'Repo',
      branchName: 'Branch',
      image: 'Image',
      tag: 'Tag',
      version: 'Version',
      fileName: 'File Name'
    }
  }

  public get name (): string {
    return DockerfileImageReport.name
  }
}
