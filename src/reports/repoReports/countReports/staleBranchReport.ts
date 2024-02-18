import {
  type Repo
} from '../../../types'
import { CountReport, CountReportWriters } from './countReport'

export class StaleBranchReport extends CountReport {
  protected async runReport (repo: Repo, writers: CountReportWriters): Promise<void> {
    let count = 0
    for (const branchName in repo.branches) {
      if (repo.branches[branchName].staleBranch) {
        count++
      }
    }

    writers.countReportWriter.addRow({
      repoName: repo.name,
      count
    })
    repo.healthScores[StaleBranchReport.name] = await this.grade(count)
    repo.reportResults.staleBranchCount = count
  }

  public get name (): string {
    return StaleBranchReport.name
  }
}
