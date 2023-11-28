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
    const currentDate = new Date()
    const fourHoursAgo = new Date(currentDate.setHours(currentDate.getHours() - 4))
    await writeJsonToFile({ lastRunDate: fourHoursAgo.toISOString() }, './lastRunDate.json') // set to four hours ago just to be safe
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error writing lastRunDate to lastRunDate.json file: ${error.message}`)
    } else {
      logger.error(`Error writing lastRunDate to lastRunDate.json file: ${error as string}`)
    }
  }
}
