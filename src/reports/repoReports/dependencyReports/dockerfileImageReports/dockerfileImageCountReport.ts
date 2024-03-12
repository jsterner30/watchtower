import { DependencyCountReport } from '../dependencyCountReport'
import { RuleFile } from '../../../../types'
import { DockerfileImageReport } from './dockerfileImageReport'
import getImagePartsFromFile from './getImagePartsFromFile'
import { errorHandler } from '../../../../util'

export class DockerfileImageCountReport extends DependencyCountReport {
  protected getDepNames (ruleFile: RuleFile): string[] {
    try {
      const imageParts = getImagePartsFromFile(ruleFile)
      if (imageParts != null) {
        return [imageParts.image]
      }
    } catch (error) {
      errorHandler(error, DockerfileImageCountReport.name)
      return []
    }
    return []
  }

  get name (): string {
    return DockerfileImageReport.name
  }
}
