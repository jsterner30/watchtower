import { Report, ReportData, Writers } from '../../report'
import { errorHandler, HeaderTitles, ReportWriter } from '../../../util'
import { Repo, RuleFile } from '../../../types'

export interface DependencyCountReportData extends ReportData {
  depName: string
  branchCount: number
  repoCount: number
}
export interface DependencyCountReportDataWriter extends Writers<DependencyCountReportData> {
  dependencyCountReportDataWriter: ReportWriter<DependencyCountReportData>
}

interface DependencyCounter {
  branches: Set<string>
  repos: Set<string>
}

export abstract class DependencyCountReport extends Report<DependencyCountReportData, DependencyCountReportDataWriter, Repo> {
  protected getHeaderTitles (): HeaderTitles<DependencyCountReportData> {
    return {
      depName: 'Dependency Name',
      branchCount: 'Number of Branches with this Dependency',
      repoCount: 'Number of Repos with this Dependency'
    }
  }

  protected getReportWriters (): DependencyCountReportDataWriter {
    return {
      dependencyCountReportDataWriter: new ReportWriter<DependencyCountReportData>(this.getHeaderTitles(), this.outputDir, this.outputDir) // these reports are written to a file with the same name as the output dir
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
      writer.addRow({
        depName,
        branchCount: overallDepCounts[depName].branches.size,
        repoCount: overallDepCounts[depName].repos.size
      })
    }

    this._reportOutputDataWriters.push(writer)
  }

  protected async runReport (): Promise<void> {
    throw new Error(`Not implemented in class ${this.name}`)
  }

  abstract get name (): string
  protected abstract getDepNames (ruleFile: RuleFile): string[]
}
