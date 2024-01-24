import {
  GradeEnum, HealthScore,
  type RepoInfo
} from '../../types'
import { errorHandler, ReportOutputData } from '../../util'
import { Report } from '../report'

export class PublicAndInternalReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const header = [
      { id: 'repoName', title: 'Repo' },
      { id: 'visibility', title: 'Visibility' }
    ]

    const publicAndInternalOutput = new ReportOutputData(header, this._outputDir, 'PublicAndInternalReport')

    for (const repo of repos) {
      try {
        if (repo.visibility !== 'private') {
          publicAndInternalOutput.addRow({
            repoName: repo.name,
            visibility: repo.visibility
          })
        }
        repo.healthScores[PublicAndInternalReport.name] = this.grade(repo.visibility)
      } catch (error) {
        errorHandler(error, PublicAndInternalReport.name, repo.name)
      }
    }

    this._reportOutputs.push(publicAndInternalOutput)
  }

  grade (input: string): HealthScore {
    if (input === 'private') {
      return {
        grade: GradeEnum.A,
        weight: this._weight
      }
    } else if (input === 'internal') {
      return {
        grade: GradeEnum.C,
        weight: this._weight
      }
    } else {
      return {
        grade: GradeEnum.F,
        weight: this._weight
      }
    }
  }

  public get name (): string {
    return PublicAndInternalReport.name
  }
}
