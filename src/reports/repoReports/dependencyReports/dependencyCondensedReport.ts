import { Report, ReportData, Writers } from '../../report'
import { anyStringRegex, HeaderTitles, Query, ReportWriter, stringToExactRegex } from '../../../util'
import { Dependency, Repo, RuleFile } from '../../../types'
import { WritableSet } from '../../../util/writable'
import { logger } from '../../../util/logger'

export interface CondensedDependencyReportData extends ReportData {
  depName: string
  branchCount: number
  repoCount: number
  lastPublishedDate: string
  createdDate: string
  maintainerCount: number
  latestVersion: string
  downloadCountLastWeek: number
  repoList: WritableSet<string>
  branchList: WritableSet<string>
}
export interface CondensedDependencyReportDataWriter extends Writers<CondensedDependencyReportData> {
  dependencyCountReportDataWriter: ReportWriter<CondensedDependencyReportData>
}

export abstract class DependencyCondensedReport extends Report<CondensedDependencyReportData, CondensedDependencyReportDataWriter, Repo> {
  protected getHeaderTitles (): HeaderTitles<CondensedDependencyReportData> {
    return {
      depName: 'Dependency Name',
      branchCount: 'Number of Branches with this Dependency',
      repoCount: 'Number of Repos with this Dependency',
      lastPublishedDate: 'Last Modification Date of the Dependency',
      createdDate: 'Creation Date of the Dependency',
      maintainerCount: 'Maintainer Count',
      latestVersion: 'Latest Version',
      downloadCountLastWeek: 'Download Count Last Week',
      repoList: 'List of repos that use this dep',
      branchList: 'List of repo branches that use this dep'
    }
  }

  protected initReportWriters (): CondensedDependencyReportDataWriter {
    return {
      dependencyCountReportDataWriter: new ReportWriter<CondensedDependencyReportData>(this.getHeaderTitles(), this.outputDir, this.outputDir, this.getExceptions()) // these reports are written to a file with the same name as the output dir
    }
  }

  public async runReport (repo: Repo): Promise<void> {
    for (const branch of Object.values(repo.branches)) {
      for (const ruleFile of branch.ruleFiles) {
        const depNames = this.getDepNames(ruleFile)
        if (depNames.length > 0) {
          for (const depName of depNames) {
            try {
              const depRows: CondensedDependencyReportData[] = this._reportWriters.dependencyCountReportDataWriter.getRows(this.getDepRowsQuery(depName))

              if (depRows.length > 1) {
                throw new Error('Multiple rows in report writer contain the same depName')
              } else if (depRows.length === 0) {
                const dependency: Dependency = await this.getDependencyInfo(depName)
                this._reportWriters.dependencyCountReportDataWriter.addRow({
                  depName,
                  branchCount: 1,
                  repoCount: 1,
                  lastPublishedDate: dependency.lastPublishedDate,
                  createdDate: dependency.createdDate,
                  maintainerCount: dependency.maintainerCount,
                  latestVersion: dependency.latestVersion,
                  downloadCountLastWeek: dependency.downloadCountLastWeek,
                  repoList: new WritableSet<string>().add(repo.name),
                  branchList: new WritableSet<string>().add(repo.name + ':' + branch.name)
                })
              } else {
                depRows[0].repoList.add(repo.name)
                depRows[0].branchList.add(repo.name + ':' + branch.name)
                depRows[0].repoCount = depRows[0].repoList.size
                depRows[0].branchCount = depRows[0].branchList.size
              }
            } catch (error) {
              logger.error(`Error writing report: ${this.name}, with dep: ${depName}, ${(error as Error).message}`)
            }
          }
        }
      }
    }
  }

  private getDepRowsQuery (depName: string): Query<CondensedDependencyReportData> {
    return {
      depName: stringToExactRegex(depName),
      branchCount: anyStringRegex,
      repoCount: anyStringRegex,
      lastPublishedDate: anyStringRegex,
      createdDate: anyStringRegex,
      maintainerCount: anyStringRegex,
      latestVersion: anyStringRegex,
      downloadCountLastWeek: anyStringRegex,
      repoList: anyStringRegex,
      branchList: anyStringRegex
    }
  }

  abstract get name (): string
  protected abstract getDepNames (ruleFile: RuleFile): string[]
  protected abstract getDependencyInfo (packageName: string): Promise<Dependency>
}
