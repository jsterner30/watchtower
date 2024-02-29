import { logger } from './logger'
import { nodeLTSUrl, startingHighestVersion, startingLowestVersion } from './constants'
import {
  CacheFile,
  Dockerfile,
  ExtremeVersions,
  FileTypeEnum,
  Repo,
  TerraformFile,
  validDockerfile,
  validGHAFile, validGHASourceFile,
  validTerraformFile,
  VersionLocation
} from '../types'
import { compare, validate } from 'compare-versions'
import stringify from 'json-stringify-safe'

export function errorHandler (error: unknown, functionName: string, repoName: string = '', branchName: string = '', fileName: string = ''): void {
  let errorMessage = ''
  if (error instanceof Error) {
    errorMessage = error.message
  } else {
    errorMessage = error as string
  }
  if (repoName !== '') {
    if (branchName !== '') {
      logger.error(`Error in ${functionName} for repo: ${repoName}, for branch: ${branchName}, error: ${errorMessage}`)
    } else {
      logger.error(`Error in ${functionName} for repo: ${repoName}, error: ${errorMessage}`)
    }
  } else {
    logger.error(`Error in ${functionName}, error: ${errorMessage}`)
  }
}

export async function fetchNodeLTSVersion (): Promise<string> {
  try {
    const response = await fetch(nodeLTSUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch schedule data. Status: ${response.status}`)
    }

    const scheduleData: any = await response.json()
    for (const version in scheduleData) {
      if (new Date(scheduleData[version].lts) < new Date() && new Date(scheduleData[version].maintenance) > new Date()) {
        return version.split('v')[1]
      }
    }

    return '20'
  } catch (error) {
    errorHandler(error, fetchNodeLTSVersion.name)
    return '20'
  }
}

// this function basically calculates a GPA
export function getOverallGPAScore (healthScores: Record<string, any>): number {
  let totalWeight = 0
  let totalPoints = 0

  for (const scoreName in healthScores) {
    if (typeof healthScores[scoreName].weight === 'number' && typeof healthScores[scoreName].grade === 'number') {
      totalWeight += healthScores[scoreName].weight as number
      totalPoints += healthScores[scoreName].grade * healthScores[scoreName].weight
    }
  }

  if (totalWeight === 0) {
    return -1
  }
  return totalPoints / totalWeight
}

export function arrayToObject (arr: Array<Record<string, any>>): Record<string, any> {
  return arr.reduce((obj, value, index) => {
    obj[index] = value
    return obj
  }, {})
}

export function removeComparatorsInVersion (version: string): string {
  let curVer = version

  const firstChar = version.at(0)
  if (firstChar != null) {
    if (!(isNumericChar(firstChar))) {
      let i = 0
      for (const letter of version) {
        if (isNumericChar(letter)) {
          break
        }
        ++i
      }
      curVer = version.substring(i)
    }
  }
  if (curVer === '') {
    return version
  }
  return curVer
}

export function getExtremeVersions (versionLocations: VersionLocation[],
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

function isNumericChar (c: string): boolean { return /\d/.test(c) }

export function stringifyJSON (json: Record<string, any> | Array<Record<string, any>>, resourceName: string): string {
  try {
    return stringify(json, null, 2)
  } catch (error) {
    logger.error(`Error stringifying file to write to cache: ${error as string} with resource: ${resourceName}`)
    return '{}'
  }
}

export function sortObjectKeys (unordered: Record<string, any>): Record<string, any> {
  const ordered: Record<string, any> = Object.keys(unordered).sort().reduce(
    (obj: Record<string, any>, key) => {
      obj[key] = unordered[key]
      return obj
    },
    {}
  )
  return ordered
}

export function attachMetadataToCacheFile (info: Record<string, Repo>, branchCount: number = 0): CacheFile {
  return {
    metadata: {
      repoCount: Object.keys(info).length,
      branchCount,
      lastRunDate: new Date().toISOString()
    },
    info: sortObjectKeys(info)
  }
}

export function gatherNodeFiles (repo: Repo, branchName: string): VersionLocation[] {
  const branchNodeFiles: VersionLocation[] = []
  for (const dep of repo.branches[branchName].deps) {
    if (validDockerfile.Check(dep) && dep.fileType === FileTypeEnum.DOCKERFILE) {
      const versionLocation = getDockerfileImageVersion(dep, branchName, 'node')
      if (versionLocation != null) {
        branchNodeFiles.push(versionLocation)
      }
    } else if (validGHAFile.Check(dep) && dep.fileType === FileTypeEnum.GITHUB_ACTION) {
      if (dep.contents.env?.node_version != null) {
        branchNodeFiles.push({ filePath: dep.fileName, version: dep.contents.env.node_version, branch: branchName })
      }
    } else if (validTerraformFile.Check(dep) && dep.fileType === 'TERRAFORM') {
      const versionLocation = getTerraformLambdaRuntimeVersion(dep, branchName, 'nodejs')
      if (versionLocation != null) {
        branchNodeFiles.push(versionLocation)
      }
    } else if (validGHASourceFile.Check(dep) && dep.fileType === 'GITHUB_ACTION_SOURCE') {
      if ((dep.contents?.runs?.using as string)?.includes('node')) {
        const version = dep.contents.runs.using.split('node')[1]
        branchNodeFiles.push({ filePath: dep.fileName, version, branch: branchName })
      }
    }
  }
  return branchNodeFiles
}

export function gatherTerraformFiles (repo: Repo, branchName: string): VersionLocation[] {
  const branchTerraformFiles: VersionLocation[] = []
  for (const dep of repo.branches[branchName].deps) {
    if (validTerraformFile.Check(dep) && dep.fileType === FileTypeEnum.TERRAFORM) {
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (dep.contents.terraform?.[0]?.required_version != null) {
        branchTerraformFiles.push({
          filePath: dep.fileName,
          version: removeComparatorsInVersion(dep.contents.terraform?.[0].required_version),
          branch: branchName
        })
      }
    } else if (validGHAFile.Check(dep) && dep.fileType === FileTypeEnum.GITHUB_ACTION) {
      if (dep.contents.env?.tf_version != null) {
        branchTerraformFiles.push({ filePath: dep.fileName, version: removeComparatorsInVersion(dep.contents.env.tf_version), branch: branchName })
      }
    }
  }
  return branchTerraformFiles
}

export function gatherPythonFiles (repo: Repo, branchName: string): VersionLocation[] {
  const branchPythonFiles: VersionLocation[] = []
  for (const dep of repo.branches[branchName].deps) {
    if (validDockerfile.Check(dep) && dep.fileType === FileTypeEnum.DOCKERFILE) {
      const versionLocation = getDockerfileImageVersion(dep, branchName, 'python')
      if (versionLocation != null) {
        branchPythonFiles.push(versionLocation)
      }
    } else if (validTerraformFile.Check(dep) && dep.fileType === 'TERRAFORM') {
      const versionLocation = getTerraformLambdaRuntimeVersion(dep, branchName, 'python')
      if (versionLocation != null) {
        branchPythonFiles.push(versionLocation)
      }
    }
  }
  return branchPythonFiles
}

export function getDockerfileImageVersion (dep: Dockerfile, branchName: string, depName: string): VersionLocation | null {
  if (dep.image.includes(depName)) {
    // The code below will return "-1" if the node version is simply "node". Else, it will return "18.13.18-slim" if the image is "node:18.13.18-slim"
    const version = dep.image.split(depName)[1] === '' ? '-1' : dep.image.split(depName)[1].slice(1, dep.image.split(depName)[1].length)
    return {
      filePath: dep.fileName,
      version,
      branch: branchName
    }
  }
  return null
}

export function getTerraformLambdaRuntimeVersion (dep: TerraformFile, branchName: string, depName: string): VersionLocation | null {
  for (const moduleName in dep.contents.module) {
    for (const subModule of dep.contents.module[moduleName]) {
      if (subModule.runtime != null) {
        if ((subModule.runtime as string).includes(depName)) {
          return { filePath: dep.fileName, version: subModule.runtime.split(depName)[1], branch: branchName }
        }
      }
    }
  }
  return null
}
