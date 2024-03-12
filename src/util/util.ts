import { logger } from './logger'
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

export function stringifyJSON (json: Record<string, any> | Array<Record<string, any>>, resourceName: string): string {
  try {
    return stringify(json, null, 2)
  } catch (error) {
    logger.error(`Error stringifying file to write to cache: ${(error as Error).message} with resource: ${resourceName}`)
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

export function removeComparatorsInVersion (version: string): string {
  if (version === '') {
    return 'latest'
  }
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

export function isNumericChar (c: string): boolean { return /\d/.test(c) }
