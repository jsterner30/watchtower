import { readJsonFromFile, writeJsonToFile } from './util'
import { logger } from './logger'

export interface Info {
  lastRunDate: string
}

export async function getLastRunDate (): Promise<Info> {
  const info = await readJsonFromFile('./lastRunDate.json') as Info
  if (info == null) {
    const newInfo = { lastRunDate: '1970-01-01T00:00:00Z' }
    await writeJsonToFile(newInfo, './lastRunDate.json')
    return newInfo
  }
  return info
}

export async function setLastRunDate (): Promise<void> {
  try {
    await writeJsonToFile({ lastRunDate: new Date().toISOString() }, './lastRunDate.json')
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error writing lastRunDate to lastRunDate.json file: ${error.message}`)
    } else {
      logger.error(`Error writing lastRunDate to lastRunDate.json file: ${error as string}`)
    }
  }
}
