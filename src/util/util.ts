import { logger } from './logger'
import stringify from 'json-stringify-safe'

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

// eslint-disable-next-line no-extend-native
Object.defineProperty(RegExp.prototype, 'toJSON', { // https://stackoverflow.com/a/12075970/6901706
  value: RegExp.prototype.toString
})

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
