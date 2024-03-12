import { DependencyCountReport } from '../dependencyCountReport'
import { RuleFile } from '../../../../types'
import getTerraformModulePartsFromFile from './getTerraformModulePartsFromFile'
import { errorHandler } from '../../../../util'

export class TerraformModuleCountReport extends DependencyCountReport {
  protected getDepNames (ruleFile: RuleFile): string[] {
    const moduleNames = []
    try {
      const moduleParts = getTerraformModulePartsFromFile(ruleFile)
      for (const modulePart of moduleParts) {
        moduleNames.push(modulePart.name)
      }
      return moduleNames
    } catch (error) {
      errorHandler(error, TerraformModuleCountReport.name)
      return []
    }
  }

  get name (): string {
    return TerraformModuleCountReport.name
  }
}
