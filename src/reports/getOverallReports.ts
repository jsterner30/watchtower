import { OverallBranchReport } from './overallReports/overallBranchReport'
import { OverallRepoReport } from './overallReports/overallRepoReport'
import { OverallHealthScoreReport } from './overallReports/overallHealthScoreReport'

export interface OverallReports {
  overallBranchReport: OverallBranchReport
  overallRepoReport: OverallRepoReport
  overallHealthScoreReport: OverallHealthScoreReport
}

export function getOverallReports (): OverallReports {
  return {
    overallBranchReport: new OverallBranchReport(0, 'OverallReports', 'General details about every non-dependabot branch in the org', '1', 'overall'),
    overallRepoReport: new OverallRepoReport(0, 'OverallReports', 'General details about the non archived repo in the org', '1', 'overall'),
    overallHealthScoreReport: new OverallHealthScoreReport(0, 'OverallReports', 'A healthscore assigned to each repo based on contributing repo reports. More info can be found in the "Overall Health Scoring" section of the README.md file.', '1', 'overall')
  }
}
