import {
  type RepoInfo,
  GradeEnum, HealthScore
} from '../../types'
import { errorHandler, ReportOutputData } from '../../util'
import { Report } from '../report'

export class TeamlessRepoReport extends Report {
  get reportOutputs (): ReportOutputData[] {
    return this._reportOutputs
  }

  async run (repos: RepoInfo[]): Promise<void> {
    const header = [{ id: 'repoName', title: 'Repo' }]
    const teamlessReportOutput = new ReportOutputData(header, this._outputDir, 'TeamlessRepoReport')

    for (const repo of repos) {
      try {
        if (repo.teams.length === 0) {
          teamlessReportOutput.addRow({
            repoName: repo.name
          })
        }

        repo.healthScores[TeamlessRepoReport.name] = this.grade(repo.teams.length === 0)
      } catch (error) {
        errorHandler(error, TeamlessRepoReport.name, repo.name)
      }
    }
    this._reportOutputs.push(teamlessReportOutput)
  }

  grade (input: boolean): HealthScore {
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
}
