import { DependencyCountReport } from '../dependencyCountReport'
import { RuleFile } from '../../../../types'
import { errorHandler } from '../../../../util'
import getNPMDependencyPartsFromFile from './getNPMDependencyPartsFromFile'

export class NPMDependencyCountReport extends DependencyCountReport {
  protected getDepNames (ruleFile: RuleFile): string[] {
    const depNames = []
    try {
      const depParts = getNPMDependencyPartsFromFile(ruleFile)
      for (const dep of depParts) {
        depNames.push(dep.name)
      }
      return depNames
    } catch (error) {
      errorHandler(error, NPMDependencyCountReport.name)
      return []
    }
  }

  get name (): string {
    return NPMDependencyCountReport.name
  }
}
