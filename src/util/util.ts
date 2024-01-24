import { logger } from './logger'
import { nodeLTSUrl, startingHighestVersion, startingLowestVersion } from './constants'
import { ExtremeVersions, VersionLocation } from '../types'
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

    const scheduleData = await response.json()
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

export function getExtremeVersions (versionLocations: VersionLocation[], currentExtremeVersions: ExtremeVersions = { lowestVersion: startingLowestVersion, highestVersion: startingHighestVersion }): ExtremeVersions {
  for (const versionLocation of versionLocations) {
    if (validate(versionLocation.version)) {
      if (compare(currentExtremeVersions.lowestVersion, versionLocation.version, '>')) {
        currentExtremeVersions.lowestVersion = versionLocation.version
      }
      if (compare(currentExtremeVersions.highestVersion, versionLocation.version, '<')) {
        currentExtremeVersions.highestVersion = versionLocation.version
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
