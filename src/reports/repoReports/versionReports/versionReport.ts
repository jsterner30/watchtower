import { Writers } from '../../report'
import { Dockerfile, ExtremeVersions, Repo, TerraformFile, VersionLocation } from '../../../types'
import {
  startingLowestVersion,
  startingHighestVersion,
  errorHandler, HeaderTitles
} from '../../../util'
import { RepoReport, RepoReportData } from '../repoReport'
import { compare, validate } from 'compare-versions'

export abstract class VersionReport<T extends RepoReportData, U extends Writers<T>> extends RepoReport<T, U> {
  protected abstract readonly versionUtils: VersionUtils
  abstract get name (): string
  protected abstract runReport (repo: Repo, writers: U): Promise<void>
  protected abstract getReportWriters (): U
  protected abstract getHeaderTitles (): HeaderTitles<T>
}

// helper class used to run version reports
export abstract class VersionUtils {
  abstract gatherSoftwareFiles (repo: Repo, branchName: string): VersionLocation[]
  abstract get name (): string

  public getBranchLowAndHighVersions (repo: Repo): Record<string, ExtremeVersions> {
    const allBranchVersionExtremes: Record<string, ExtremeVersions> = {}
    for (const branchName in repo.branches) {
      try {
        const branchFiles = this.gatherSoftwareFiles(repo, branchName)
        if (branchFiles.length === 0) {
          // no relevant files in repo branch
          continue
        }

        // get the lowest and highest version on the branch
        const branchExtremeVersions = this.getExtremeVersions(branchFiles)
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

  public getExtremeVersions (versionLocations: VersionLocation[],
    currentExtremeVersions: ExtremeVersions = {
      lowestVersion: startingLowestVersion,
      lowestVersionBranch: '',
      lowestVersionPath: '',
      highestVersion: startingHighestVersion,
      highestVersionPath: '',
      highestVersionBranch: ''
    }
  ): ExtremeVersions {
    for (const versionLocation of versionLocations) {
      if (validate(versionLocation.version)) {
        if (compare(currentExtremeVersions.lowestVersion, versionLocation.version, '>')) {
          currentExtremeVersions.lowestVersion = versionLocation.version
          currentExtremeVersions.lowestVersionPath = versionLocation.filePath
          currentExtremeVersions.lowestVersionBranch = versionLocation.branch
        }
        if (compare(currentExtremeVersions.highestVersion, versionLocation.version, '<')) {
          currentExtremeVersions.highestVersion = versionLocation.version
          currentExtremeVersions.highestVersionPath = versionLocation.filePath
          currentExtremeVersions.highestVersionBranch = versionLocation.branch
        }
      }
    }
    return currentExtremeVersions
  }

  protected getDockerfileImageVersion (dockerFile: Dockerfile, branchName: string, depName: string): VersionLocation[] {
    const versions: VersionLocation[] = []
    if (dockerFile.image.includes(depName)) {
      // The code below will return "-1" if the node version is simply "node". Else, it will return "18.13.18-slim" if the image is "node:18.13.18-slim"
      const version = dockerFile.image.split(depName)[1] === '' ? '-1' : dockerFile.image.split(depName)[1].slice(1, dockerFile.image.split(depName)[1].length)
      versions.push({
        filePath: dockerFile.fileName,
        version,
        branch: branchName
      })
    }
    return versions
  }

  protected getTerraformLambdaRuntimeVersion (dep: TerraformFile, branchName: string, depName: string): VersionLocation[] {
    const versions: VersionLocation[] = []
    this.traverseObject(dep, ['runtime', 'zip_runtime'], depName, versions, dep.fileName, branchName)
    return versions
  }

  /**
   * Traverse the file, looking for particular key-value pairs.
   * If they are found, it adds them to the passed-in 'versions' array
   *
   * If the value doesn't matter, and you want to only get the value based on the key, then pass in `null` for searchString
   * If the value must contain a certain string, pass that string in for the searchString
   */
  protected traverseObject (
    obj: Record<string, any>,
    targetStrings: string[],
    searchString: string | null,
    versions: VersionLocation[],
    fileName: string,
    branchName: string
  ): void {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.traverseObject(obj[key], targetStrings, searchString, versions, fileName, branchName)
      } else if (searchString === null && targetStrings.includes(key)) {
        // if searchString is null, just check to see if targetStrings includes the key
        versions.push({ filePath: fileName, version: obj[key].toString(), branch: branchName })
      } else if (searchString !== null &&
          targetStrings.includes(key) &&
          typeof obj[key] === 'string' &&
          (obj[key] as string).includes(searchString)) {
        // if searchString is a string, check that the value includes that searchString, then split the version on the search string
        versions.push({ filePath: fileName, version: obj[key].split(searchString)[1], branch: branchName })
      }
    }
  }
}
