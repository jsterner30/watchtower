import { GradeEnum, HealthScore, Repo } from '../../types'
import { HeaderTitles } from '../../util'
import { logger } from '../../util/logger'
import { Report, ReportData, Writers } from '../report'

export interface RepoReportData extends ReportData {
  repoName: string
}

// Reports are functions that aggregate the data gathered by a rule and output it to a csv and json file.
// They run very quickly and therefore have no need to be cached.
export abstract class RepoReport<T extends RepoReportData, U extends Writers<T>> extends Report<T, U, Repo> {
  protected async grade (input: unknown): Promise<HealthScore> {
    logger.error(`The ${this.name} does not implement the grade method because this report does not contribute to the overall health report`)
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }

  public abstract get name (): string
  protected abstract getHeaderTitles (): HeaderTitles<T>
  protected abstract initReportWriters (): U
  protected abstract runReport (repo: Repo): Promise<void>
}
