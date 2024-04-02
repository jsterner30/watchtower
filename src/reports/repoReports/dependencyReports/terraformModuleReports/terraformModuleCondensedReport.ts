import { DependencyCondensedReport } from '../dependencyCondensedReport'
import { Dependency, RuleFile } from '../../../../types'
import getTerraformModulePartsFromFile from './getTerraformModulePartsFromFile'
import { errorHandler } from '../../../../util'

export class TerraformModuleCondensedReport extends DependencyCondensedReport {
  protected getDepNames (ruleFile: RuleFile): string[] {
    const moduleNames = []
    try {
      const moduleParts = getTerraformModulePartsFromFile(ruleFile)
      for (const modulePart of moduleParts) {
        moduleNames.push(modulePart.name)
      }
      return moduleNames
    } catch (error) {
      errorHandler(error, TerraformModuleCondensedReport.name)
      return []
    }
  }

  get name (): string {
    return TerraformModuleCondensedReport.name
  }

  // not yet correctly implemented
  public async getDependencyInfo (packageName: string): Promise<Dependency> {
    return {
      dependencyName: packageName,
      dependencyEnvironment: 'terraform',
      lastPublishedDate: '',
      createdDate: '',
      description: '',
      maintainerCount: -1,
      latestVersion: '',
      downloadCountLastWeek: -1
    }
  }
}
