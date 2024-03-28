import { Writers } from '../report'
import {
  getOverallGPAScore,
  HeaderTitles,
  ReportWriter
} from '../../util'
import { GradeEnum, Repo } from '../../types'
import { RepoReport, RepoReportData } from '../repoReports/repoReport'
import { getRepoReports, RepoReports } from '../getRepoReports'
import { logger } from '../../util/logger'

// this report data has to be dynamic so that any new report with a weight > 0 gets added, and therefore we need a more generic ReportData type
interface OverallHealthScoreReportData extends RepoReportData {
  [key: string]: any
}
interface OverallHealthScoreReportWriters extends Writers<OverallHealthScoreReportData> {
  overallHealthScoreReportWriter: ReportWriter<OverallHealthScoreReportData>
}

export class OverallHealthScoreReport extends RepoReport<OverallHealthScoreReportData, OverallHealthScoreReportWriters> {
  protected async runReport (repo: Repo, writers: OverallHealthScoreReportWriters): Promise<void> {
    const repoReports: RepoReports = getRepoReports()
    const overallScore = getOverallGPAScore(repo.healthScores)
    const reportRow: OverallHealthScoreReportData = {
      repoName: repo.name,
      overallScore,
      teams: repo.teams,
      lastCommitDate: repo.lastCommit.date,
      lastCommitAuthor: repo.lastCommit.author
    }

    for (const report of Object.values(repoReports)) {
      try {
        // only include contributing reports
        if (report.weight > 0) {
          reportRow[report.name] = repo.healthScores[report.name]?.grade ?? GradeEnum.NotApplicable
        }
      } catch (error) {
        logger.error(`Error adding row to overall health report for repo: ${repo.name}, report: ${report.name as string}, error: ${(error as Error).message}`)
      }
    }

    writers.overallHealthScoreReportWriter.addRow(reportRow)
  }

  protected getReportWriters (): OverallHealthScoreReportWriters {
    return {
      overallHealthScoreReportWriter: new ReportWriter<OverallHealthScoreReportData>(this.getHeaderTitles(), this._outputDir, this.name, this.getExceptions())
    }
  }

  protected getHeaderTitles (): HeaderTitles<OverallHealthScoreReportData> {
    const header: HeaderTitles<OverallHealthScoreReportData> = {
      repoName: 'Repo',
      overallScore: 'Overall Score/Grade',
      teams: 'Admin Teams',
      lastCommitDate: 'Last Commit Date',
      lastCommitAuthor: 'Last Commit User'
    }
    const repoReports: RepoReports = getRepoReports()

    for (const report of Object.values(repoReports)) {
      // only include contributing reports
      if (report.weight > 0) {
        header[report.name] = report.name
      }
    }

    return header
  }

  public get name (): string {
    return OverallHealthScoreReport.name
  }
}
