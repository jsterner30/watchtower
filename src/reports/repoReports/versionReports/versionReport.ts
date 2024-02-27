import { Writers } from '../../report'
import { ExtremeVersions, Repo, VersionLocation } from '../../../types'
import {
  getExtremeVersions,
  startingLowestVersion,
  startingHighestVersion,
  errorHandler, HeaderTitles
} from '../../../util'
import { RepoReport, RepoReportData } from '../repoReport'

export abstract class VersionReport<T extends RepoReportData, U extends Writers<T>> extends RepoReport<T, U> {
  abstract get name (): string
  protected abstract runReport (repo: Repo, writers: U): Promise<void>
  protected abstract getReportWriters (): U
  protected abstract getHeaderTitles (): HeaderTitles<T>
  protected abstract gatherSoftwareFiles (repo: Repo, branchName: string): VersionLocation[]
  getBranchLowAndHighVersions (repo: Repo): Record<string, ExtremeVersions> {
    const allBranchVersionExtremes: Record<string, ExtremeVersions> = {}
    for (const branchName in repo.branches) {
      try {
        const branchFiles = this.gatherSoftwareFiles(repo, branchName)
        if (branchFiles.length === 0) {
          // no relevant files in repo branch
          continue
        }

        // get the lowest and highest version on the branch
        const branchExtremeVersions = getExtremeVersions(branchFiles)
        // if the lowest and highest versions have not changed, there was version on the branch
        if (branchExtremeVersions.lowestVersion !== startingLowestVersion && branchExtremeVersions.highestVersion !== startingHighestVersion) {
          allBranchVersionExtremes[branchName] = branchExtremeVersions
        }
      } catch (error) {
        errorHandler(error, this.name, repo.name, branchName)
      }
    }
    return allBranchVersionExtremes
  }
}
