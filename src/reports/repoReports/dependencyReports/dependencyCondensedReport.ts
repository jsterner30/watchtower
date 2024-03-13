import { Report, ReportData, Writers } from '../../report'
import { errorHandler, HeaderTitles, ReportWriter } from '../../../util'
import { Dependency, Repo, RuleFile } from '../../../types'

export interface CondensedDependencyReportData extends ReportData {
  depName: string
  branchCount: number
  repoCount: number
  lastModifiedDate: string
  createdDate: string
  description: string
  maintainerCount: number
  latestVersion: string
  downloadCountLastWeek: number
}
export interface CondensedDependencyReportDataWriter extends Writers<CondensedDependencyReportData> {
  dependencyCountReportDataWriter: ReportWriter<CondensedDependencyReportData>
}

interface DependencyCounter {
  branches: Set<string>
  repos: Set<string>
}

export abstract class DependencyCondensedReport extends Report<CondensedDependencyReportData, CondensedDependencyReportDataWriter, Repo> {
  protected getHeaderTitles (): HeaderTitles<CondensedDependencyReportData> {
    return {
      depName: 'Dependency Name',
      branchCount: 'Number of Branches with this Dependency',
      repoCount: 'Number of Repos with this Dependency',
      lastModifiedDate: 'Last Modification Date of the Dependency',
      createdDate: 'Creation Date of the Dependency',
      description: 'Description',
      maintainerCount: 'Maintainer Count',
      latestVersion: 'Latest Version',
      downloadCountLastWeek: 'Download Count Last Week'
    }
  }

  protected getReportWriters (): CondensedDependencyReportDataWriter {
    return {
      dependencyCountReportDataWriter: new ReportWriter<CondensedDependencyReportData>(this.getHeaderTitles(), this.outputDir, this.outputDir) // these reports are written to a file with the same name as the output dir
    }
  }

  public async run (repos: Repo[]): Promise<void> {
    const overallDepCounts: Record<string, DependencyCounter> = {}
    for (const repo of repos) {
      for (const branch of Object.values(repo.branches)) {
        try {
          for (const ruleFile of branch.ruleFiles) {
            const depNames = this.getDepNames(ruleFile)
            if (depNames.length > 0) {
              for (const depName of depNames) {
                if (overallDepCounts[depName] == null) {
                  overallDepCounts[depName] = {
                    branches: new Set<string>(),
                    repos: new Set<string>()
                  }
                }
                overallDepCounts[depName].branches.add(repo.name + ':' + branch.name)
                overallDepCounts[depName].repos.add(repo.name)
              }
            }
          }
        } catch (error) {
          errorHandler(error, this.name, repo.name, branch.name)
        }
      }
    }

    const writer = this.getReportWriters().dependencyCountReportDataWriter
    for (const depName in overallDepCounts) {
      const dependency: Dependency = await this.getDependencyInfo(depName)
      writer.addRow({
        depName,
        branchCount: overallDepCounts[depName].branches.size,
        repoCount: overallDepCounts[depName].repos.size,
        lastModifiedDate: dependency.lastModifiedDate,
        createdDate: dependency.createdDate,
        description: dependency.description,
        maintainerCount: dependency.maintainerCount,
        latestVersion: dependency.latestVersion,
        downloadCountLastWeek: dependency.downloadCountLastWeek
      })
    }

    this._reportOutputDataWriters.push(writer)
  }

  protected async runReport (): Promise<void> {
    throw new Error(`Not implemented in class ${this.name}`)
  }

  abstract get name (): string
  protected abstract getDepNames (ruleFile: RuleFile): string[]
  protected abstract getDependencyInfo (packageName: string): Promise<Dependency>
}
