import { DependencyCondensedReport } from '../dependencyCondensedReport'
import { Dependency, RuleFile } from '../../../../types'
import { errorHandler } from '../../../../util'
import getNPMDependencyPartsFromFile from '../npmDependencyReports/getNPMDependencyPartsFromFile'

export class PIPDependencyCondensedReport extends DependencyCondensedReport {
  protected getDepNames (ruleFile: RuleFile): string[] {
    const depNames = []
    try {
      const depParts = getNPMDependencyPartsFromFile(ruleFile)
      for (const dep of depParts) {
        depNames.push(dep.name)
      }
      return depNames
    } catch (error) {
      errorHandler(error, PIPDependencyCondensedReport.name)
      return []
    }
  }

  get name (): string {
    return PIPDependencyCondensedReport.name
  }

  // not yet correctly implemented
  public async getDependencyInfo (packageName: string): Promise<Dependency> {
    return {
      dependencyName: packageName,
      dependencyEnvironment: 'pip',
      lastPublishedDate: '',
      createdDate: '',
      maintainerCount: -1,
      latestVersion: '',
      downloadCountLastWeek: -1
    }
  }
}
