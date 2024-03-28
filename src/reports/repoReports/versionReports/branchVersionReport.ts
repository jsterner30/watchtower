import { Writers } from '../../report'
import { ExtremeVersions, Repo } from '../../../types'
import {
  ReportWriter,
  HeaderTitles
} from '../../../util'
import { VersionReport } from './versionReport'
import { RepoReportData } from '../repoReport'

export interface BranchVersionReportData extends RepoReportData {
  repoName: string
  branchName: string
  lowestVersion: string
  lowestVersionPath: string
  highestVersion: string
  highestVersionPath: string
}
interface BranchVersionReportWriters extends Writers<BranchVersionReportData> {
  defaultBranchVersionReportWriter: ReportWriter<BranchVersionReportData>
  allBranchesVersionReportWriter: ReportWriter<BranchVersionReportData>
}

export abstract class BranchVersionReport extends VersionReport<BranchVersionReportData, BranchVersionReportWriters> {
  protected getHeaderTitles (): HeaderTitles<BranchVersionReportData> {
    return {
      repoName: 'Repo',
      branchName: 'Branch',
      lowestVersion: 'Lowest Version',
      lowestVersionPath: 'Lowest Version Path',
      highestVersion: 'Highest Version',
      highestVersionPath: 'Highest Version Path'
    }
  }

  protected getReportWriters (): BranchVersionReportWriters {
    return {
      defaultBranchVersionReportWriter: new ReportWriter<BranchVersionReportData>(this.getHeaderTitles(), this._outputDir, `${this.name}-DefaultBranches`, this.getExceptions()),
      allBranchesVersionReportWriter: new ReportWriter<BranchVersionReportData>(this.getHeaderTitles(), this._outputDir, `${this.name}-AllBranches`, this.getExceptions())
    }
  }

  protected async runReport (repo: Repo, writers: BranchVersionReportWriters): Promise<void> {
    const allBranchVersionExtremes = this.versionUtils.getBranchLowAndHighVersions(repo)
    if (Object.keys(allBranchVersionExtremes).length === 0) {
      return
    }

    for (const branchName in allBranchVersionExtremes) {
      const branchExtremes = allBranchVersionExtremes[branchName]
      if (branchName === repo.defaultBranch) {
        writers.defaultBranchVersionReportWriter.addRow({
          repoName: repo.name,
          branchName,
          lowestVersion: branchExtremes.lowestVersion,
          lowestVersionPath: branchExtremes.lowestVersionPath,
          highestVersion: branchExtremes.highestVersion,
          highestVersionPath: branchExtremes.highestVersionPath
        })
      }
      writers.allBranchesVersionReportWriter.addRow({
        repoName: repo.name,
        branchName,
        lowestVersion: branchExtremes.lowestVersion,
        lowestVersionPath: branchExtremes.lowestVersionPath,
        highestVersion: branchExtremes.highestVersion,
        highestVersionPath: branchExtremes.highestVersionPath
      })
      this.modifyReportBranchResults(branchExtremes, repo, branchName)
    }
  }
  abstract get name (): string
  protected abstract modifyReportBranchResults (branchExtremeVersions: ExtremeVersions, repo: Repo, branchName: string): void
}
