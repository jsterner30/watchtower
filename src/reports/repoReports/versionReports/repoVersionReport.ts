import { Writers } from '../../report'
import { ExtremeVersions, Grade, GradeEnum, HealthScore, Repo, VersionLocation } from '../../../types'
import {
  ReportWriter,
  HeaderTitles
} from '../../../util'
import { VersionReport } from './versionReport'
import { compare, validate } from 'compare-versions'
import { RepoReportData } from '../repoReport'

interface RepoVersionReportData extends RepoReportData {
  repoName: string
  lowestVersion: string
  lowestVersionBranch: string
  lowestVersionPath: string
  highestVersion: string
  highestVersionBranch: string
  highestVersionPath: string
}
interface RepoVersionReportWriters extends Writers<RepoVersionReportData> {
  allBranchesRepoWriter: ReportWriter<RepoVersionReportData>
}

export abstract class RepoVersionReport extends VersionReport<RepoVersionReportData, RepoVersionReportWriters> {
  abstract get name (): string
  protected abstract getGradeMinValues (): Promise<Record<string, Grade>>

  protected getHeaderTitles (): HeaderTitles<RepoVersionReportData> {
    return {
      repoName: 'Repo',
      lowestVersion: 'Lowest Version',
      lowestVersionBranch: 'Lowest Version Branch',
      lowestVersionPath: 'Lowest Version Path',
      highestVersion: 'Highest Version',
      highestVersionBranch: 'Highest Version Branch',
      highestVersionPath: 'Highest Version Path'
    }
  }

  protected getReportWriters (): RepoVersionReportWriters {
    return {
      allBranchesRepoWriter: new ReportWriter(this.getHeaderTitles(), this._outputDir, `${this.name}-Repos-AllBranches`)
    }
  }

  protected async grade (input: string): Promise<HealthScore> {
    if (!validate(input)) {
      return {
        grade: GradeEnum.NotApplicable,
        weight: this._weight
      }
    }
    const gradeMinValues: Record<string, Grade> = await this.getGradeMinValues()

    for (const minValue in gradeMinValues) {
      if (compare(input, minValue, '>=')) {
        return {
          grade: gradeMinValues[minValue],
          weight: this._weight
        }
      }
    }
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }

  protected async runReport (repo: Repo, writers: RepoVersionReportWriters): Promise<void> {
    // we add each most extreme version on every branch to these arrays, then use them to get the highest and lowest versions in the whole repo
    const allBranchVersionExtremes = this.versionUtils.getBranchLowAndHighVersions(repo)
    if (Object.keys(allBranchVersionExtremes).length === 0) {
      return
    }

    const branchVersionLocations: VersionLocation[] = []
    for (const branchName in allBranchVersionExtremes) {
      branchVersionLocations.push({
        filePath: allBranchVersionExtremes[branchName].lowestVersionPath,
        version: allBranchVersionExtremes[branchName].lowestVersion,
        branch: allBranchVersionExtremes[branchName].lowestVersionBranch
      })
      branchVersionLocations.push({
        filePath: allBranchVersionExtremes[branchName].highestVersionPath,
        version: allBranchVersionExtremes[branchName].highestVersion,
        branch: allBranchVersionExtremes[branchName].highestVersionBranch
      })
    }
    const overallRepoExtremes = this.versionUtils.getExtremeVersions(branchVersionLocations)
    writers.allBranchesRepoWriter.addRow({ ...{ repoName: repo.name }, ...overallRepoExtremes })
    repo.healthScores[this.name] = await this.grade(overallRepoExtremes.lowestVersion)
    this.modifyReportRepoResults(overallRepoExtremes, repo)
  }

  protected abstract modifyReportRepoResults (branchExtremeVersions: ExtremeVersions, repo: Repo): void
}
