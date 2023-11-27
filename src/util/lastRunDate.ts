import { readJsonFromFile, writeJsonToFile } from './util'
import { logger } from './logger'
import path from 'path'

export interface Info {
  lastRunDate: string
}

export async function getLastRunDate (): Promise<Info> {
  const filePath = path.join('../data/lastRunDate.json')
  const info = await readJsonFromFile(filePath) as Info
  if (info == null) {
    const newInfo = { lastRunDate: '1970-01-01T00:00:00Z' }
    await writeJsonToFile(newInfo, filePath)
    return newInfo
  }
  return info
}

export async function setLastRunDate (): Promise<void> {
  try {
    const filePath = path.join('../data/lastRunDate.json')
    await writeJsonToFile({ lastRunDate: new Date().toISOString() }, filePath)
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error writing lastRunDate to lastRunDate.json file: ${error.message}`)
    } else {
      logger.error(`Error writing lastRunDate to lastRunDate.json file: ${error as string}`)
    }
  }
}
