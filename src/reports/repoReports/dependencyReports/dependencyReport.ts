import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'
import { HeaderTitles } from '../../../util'
import { Repo } from '../../../types'

export interface DependencyReportData extends RepoReportData {
  repoName: string
  branchName: string
  fileName: string
  version: string
}

export interface DependencyInstanceReportWriters<T extends DependencyReportData> extends Writers<T> {}

export abstract class DependencyReport<T extends DependencyReportData> extends RepoReport<T, DependencyInstanceReportWriters<T>> {
  protected getReportWriters (): DependencyInstanceReportWriters<T> {
    return {}
  }
  abstract get name (): string
  protected abstract getHeaderTitles (): HeaderTitles<T>
  protected abstract runReport (repo: Repo): Promise<void>
}
