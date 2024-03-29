import {
  type Repo
} from '../../../types'
import { errorHandler } from '../../../util'
import { CountReport } from './countReport'

export class DependabotBranchReport extends CountReport {
  protected async runReport (repo: Repo): Promise<void> {
    let count = 0
    for (const branchName in repo.branches) {
      try {
        if (repo.branches[branchName].dependabot) {
          count++
        }
      } catch (error) {
        errorHandler(error, DependabotBranchReport.name, repo.name, branchName)
      }
    }

    this._reportWriters.countReportWriter.addRow({
      repoName: repo.name,
      count
    })

    repo.healthScores[DependabotBranchReport.name] = await this.grade(count)
    repo.reportResults.dependabotBranchCount = count
  }

  public get name (): string {
    return DependabotBranchReport.name
  }
}
