import { Writers } from '../../report'
import {
  getOverallGPAScore,
  HeaderTitles,
  ReportWriter
} from '../../../util'
import { Repo } from '../../../types'
import { RepoReport, RepoReportData } from '../repoReport'

interface OverallHealthScoreReportData extends RepoReportData {
  repoName: string
  overallScore: number
  teams: string[]
  lastCommitDate: string
  lastCommitAuthor: string
}
interface OverallHealthScoreReportWriters extends Writers<OverallHealthScoreReportData> {
  overallHealthScoreReportWriter: ReportWriter<OverallHealthScoreReportData>
}

export class OverallHealthScoreReport extends RepoReport<OverallHealthScoreReportData, OverallHealthScoreReportWriters> {
  protected async runReport (repo: Repo, writers: OverallHealthScoreReportWriters): Promise<void> {
    const overallScore = getOverallGPAScore(repo.healthScores)
    writers.overallHealthScoreReportWriter.addRow({
      repoName: repo.name,
      overallScore,
      teams: repo.teams,
      lastCommitDate: repo.lastCommit.date,
      lastCommitAuthor: repo.lastCommit.author
    })
  }

  protected getReportWriters (): OverallHealthScoreReportWriters {
    return {
      overallHealthScoreReportWriter: new ReportWriter<OverallHealthScoreReportData>(this.getHeaderTitles(), this._outputDir, this.name)
    }
  }

  protected getHeaderTitles (): HeaderTitles<OverallHealthScoreReportData> {
    return {
      repoName: 'Repo',
      overallScore: 'Overall Score/Grade',
      teams: 'Admin Teams',
      lastCommitDate: 'Last Commit Date',
      lastCommitAuthor: 'Last Commit User'
    }
  }

  public get name (): string {
    return OverallHealthScoreReport.name
  }
}
