import { DependencyCountReport } from '../dependencyCountReport'
import { RuleFile } from '../../../../types'
import { errorHandler } from '../../../../util'
import getNPMDependencyPartsFromFile from '../npmDependencyReports/getNPMDependencyPartsFromFile'

export class PIPDependencyCountReport extends DependencyCountReport {
  protected getDepNames (ruleFile: RuleFile): string[] {
    const depNames = []
    try {
      const depParts = getNPMDependencyPartsFromFile(ruleFile)
      for (const dep of depParts) {
        depNames.push(dep.name)
      }
      return depNames
    } catch (error) {
      errorHandler(error, PIPDependencyCountReport.name)
      return []
    }
  }

  get name (): string {
    return PIPDependencyCountReport.name
  }
}
