import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'
import { HeaderTitles, ReportWriter } from '../../../util'
import { Repo } from '../../../types'

export interface DependencyReportData extends RepoReportData {
  depName: string
  repoName: string
  branchName: string
  fileName: string
  version: string
}

export interface DependencyInstanceReportWriters<T extends DependencyReportData> extends Writers<T> {
  dependencyReportWriter: ReportWriter<T>
}

export abstract class DependencyReport<T extends DependencyReportData> extends RepoReport<T, DependencyInstanceReportWriters<T>> {
  protected getReportWriters (): DependencyInstanceReportWriters<T> {
    return {
      dependencyReportWriter: new ReportWriter<T>(this.getHeaderTitles(), this.outputDir, this.name, this.getExceptions())
    }
  }
  abstract get name (): string
  protected abstract getHeaderTitles (): HeaderTitles<T>
  protected abstract runReport (repo: Repo): Promise<void>
}
