import { DependencyCountReport } from '../dependencyCountReport'
import { RuleFile } from '../../../../types'
import getGhActionModulePartsFromFile from './getGhActionModulePartsFromFile'
import { errorHandler } from '../../../../util'

export class GHActionModuleCountReport extends DependencyCountReport {
  protected getDepNames (ruleFile: RuleFile): string[] {
    const moduleNames = []
    try {
      const moduleParts = getGhActionModulePartsFromFile(ruleFile)
      for (const modulePart of moduleParts) {
        moduleNames.push(modulePart.name)
      }
      return moduleNames
    } catch (error) {
      errorHandler(error, GHActionModuleCountReport.name)
      return []
    }
  }

  get name (): string {
    return GHActionModuleCountReport.name
  }
}
