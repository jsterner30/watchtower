import {
  type Repo,
  GradeEnum, HealthScore
} from '../../../types'
import { HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'

interface TeamlessRepoReportData extends RepoReportData {
  repoName: string
  admins: string[]
}
interface TeamlessRepoReportWriters extends Writers<TeamlessRepoReportData> {
  teamlessReportWriter: ReportWriter<TeamlessRepoReportData>
}

export class TeamlessRepoReport extends RepoReport<TeamlessRepoReportData, TeamlessRepoReportWriters> {
  protected async runReport (repo: Repo, writers: TeamlessRepoReportWriters): Promise<void> {
    if (repo.teams.length === 0) {
      writers.teamlessReportWriter.addRow({
        repoName: repo.name,
        admins: repo.admins
      })
    }

    repo.healthScores[TeamlessRepoReport.name] = await this.grade(repo.teams.length === 0)
  }

  protected getHeaderTitles (): HeaderTitles<TeamlessRepoReportData> {
    return {
      repoName: 'Repo',
      admins: 'Repo Admins'
    }
  }

  protected getReportWriters (): TeamlessRepoReportWriters {
    return {
      teamlessReportWriter: new ReportWriter<TeamlessRepoReportData>(this.getHeaderTitles(), this._outputDir, this.name, this.getExceptions())
    }
  }

  protected async grade (input: boolean): Promise<HealthScore> {
    if (input) {
      return {
        grade: GradeEnum.F,
        weight: this._weight
      }
    }
    return {
      grade: GradeEnum.A,
      weight: this._weight
    }
  }

  public get name (): string {
    return TeamlessRepoReport.name
  }
}
