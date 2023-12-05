import fsSync, { promises as fs } from 'node:fs'
import { logger } from './logger'
import * as path from 'path'
import { nodeLTSUrl } from './constants'
import { GradeEnum } from '../types'

export async function readJsonFromFile (filePath: string): Promise<Promise<Record<string, any>> | null> {
  try {
    const fileContent = await fs.readFile(path.resolve(filePath), 'utf-8')
    return JSON.parse(fileContent)
  } catch (error) {
    logger.error(`File: ${filePath} doesn't exist.`)
    return null
  }
}

export async function createDirectoryIfNotExist (dirPath: string): Promise<void> {
  try {
    // Check if the directory exists
    await fs.stat(path.resolve(dirPath))
  } catch (error: any) {
    if (error.code != null && error.code === 'ENOENT') {
      // Directory doesn't exist, so create it
      await createDir(dirPath)
    } else {
      logger.error('Error checking/creating/deleting directory:')
    }
  }
}

export async function createDir (dirPath: string): Promise<void> {
  await fs.mkdir(path.resolve(dirPath), { recursive: true })
}

export async function writeJsonToFile (jsonData: Record<string, any>, filePath: string): Promise<void> {
  try {
    const jsonString = JSON.stringify(jsonData, null, 2)
    await fs.writeFile(path.resolve(filePath), jsonString)
    console.log(`JSON data successfully written to ${filePath}`)
  } catch (error) {
    console.error('Error occurred while writing JSON data to file:', error)
  }
}

export async function deleteDirectoryContents (dirPath: string): Promise<void> {
  await createDirectoryIfNotExist(dirPath)
  const directoryPath = path.resolve(dirPath)
  try {
    const files = await fs.readdir(directoryPath)

    for (const file of files) {
      const filePath = path.join(directoryPath, file)
      if (fsSync.existsSync(filePath) && fsSync.statSync(filePath).isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true })
      } else {
        await fs.unlink(filePath)
      }
    }

    logger.debug(`Contents of directory ${directoryPath} deleted.`)
  } catch (error) {
    logger.error(`Error deleting directory contents: ${error as string}`)
  }
}

export async function deleteDirectory (directoryPath: string): Promise<void> {
  try {
    await fs.rm(directoryPath, { recursive: true })
  } catch (error) {
    logger.error(`Error deleting directory "${directoryPath}":`, error)
  }
}

export async function createDataDirectoriesIfNonexistent (): Promise<void> {
  const dirsToCreate: string[] = ['data', 'data/repoInfo', 'data/reports', 'data/reports/dockerfileImages',
    'data/reports/GHAModules', 'data/reports/node', 'data/reports/NPMDependencies', 'data/reports/terraform', 'data/reports/terraformModules']

  for (const dir of dirsToCreate) {
    const dirPath = path.join('./', dir)
    await createDirectoryIfNotExist(path.resolve(dirPath))
  }
}

export function errorHandler (error: unknown, functionName: string, repoName: string = '', branchName: string = ''): void {
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

export function getUniqueReposInWriterData (writerData: Array<Record<string, any>>): Set<string> {
  const repoSet: Set<string> = new Set()
  for (const row of writerData) {
    if (!repoSet.has(row.repoName)) {
      repoSet.add(row.repoName)
    }
  }
  return repoSet
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

export function numberToGrade (num: number): GradeEnum {
  if (num > 3.5) {
    return GradeEnum.A
  } else if (num > 2.5) {
    return GradeEnum.B
  } else if (num > 1.5) {
    return GradeEnum.C
  } else if (num > 0.5) {
    return GradeEnum.D
  } else {
    return GradeEnum.F
  }
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

function isNumericChar (c: string): boolean { return /\d/.test(c) }
