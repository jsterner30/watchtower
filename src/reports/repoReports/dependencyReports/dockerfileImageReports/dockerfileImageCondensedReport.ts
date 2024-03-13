import { DependencyCondensedReport } from '../dependencyCondensedReport'
import { Dependency, RuleFile } from '../../../../types'
import { DockerfileImageReport } from './dockerfileImageReport'
import getImagePartsFromFile from './getImagePartsFromFile'
import { errorHandler } from '../../../../util'

export class DockerfileImageCondensedReport extends DependencyCondensedReport {
  protected getDepNames (ruleFile: RuleFile): string[] {
    try {
      const imageParts = getImagePartsFromFile(ruleFile)
      if (imageParts != null) {
        return [imageParts.image]
      }
    } catch (error) {
      errorHandler(error, DockerfileImageCondensedReport.name)
      return []
    }
    return []
  }

  get name (): string {
    return DockerfileImageReport.name
  }

  // not yet correctly implemented
  public async getDependencyInfo (packageName: string): Promise<Dependency> {
    return {
      dependencyName: packageName,
      dependencyEnvironment: 'docker',
      lastModifiedDate: '',
      createdDate: '',
      description: '',
      maintainerCount: -1,
      latestVersion: '',
      downloadCountLastWeek: -1
    }
  }
}
