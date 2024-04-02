import { DependencyCondensedReport } from '../dependencyCondensedReport'
import { Dependency, RuleFile } from '../../../../types'
import getGhActionModulePartsFromFile from './getGhActionModulePartsFromFile'
import { errorHandler } from '../../../../util'

export class GHActionModuleCondensedReport extends DependencyCondensedReport {
  protected getDepNames (ruleFile: RuleFile): string[] {
    const moduleNames = []
    try {
      const moduleParts = getGhActionModulePartsFromFile(ruleFile)
      for (const modulePart of moduleParts) {
        moduleNames.push(modulePart.name)
      }
      return moduleNames
    } catch (error) {
      errorHandler(error, GHActionModuleCondensedReport.name)
      return []
    }
  }

  get name (): string {
    return GHActionModuleCondensedReport.name
  }

  // not yet correctly implemented
  public async getDependencyInfo (packageName: string): Promise<Dependency> {
    return {
      dependencyName: packageName,
      dependencyEnvironment: 'gha',
      lastPublishedDate: '',
      createdDate: '',
      description: '',
      maintainerCount: -1,
      latestVersion: '',
      downloadCountLastWeek: -1
    }
  }
}
