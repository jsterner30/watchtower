import fsSync, { promises as fs } from 'node:fs'
import { logger } from './logger'
import * as path from 'path'

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
  logger.debug(`Directory '${dirPath}' has been created.`)
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
    await fs.rmdir(directoryPath, { recursive: true })
    logger.debug(`Directory "${directoryPath}" and its contents have been deleted.`)
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
