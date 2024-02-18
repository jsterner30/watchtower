import { Writer } from './writer'
import { CacheFile, Repo, validRepo, validCacheFile } from '../types'
import { logger } from './logger'
import { errorHandler, stringifyJSON } from './util'
import { allReposCacheFileName, filteredWithBranchesCacheFileName, lastRunDateFileName } from './constants'

export interface CacheInfo {
  lastRunDate: string
  allRepos: CacheFile | null
  filteredWithBranches: CacheFile | null
  repos: Repo[]
}

export class Cache {
  private readonly _writer: Writer
  private readonly _useCache: boolean
  private readonly _cache: CacheInfo

  constructor (writer: Writer, useCache: boolean) {
    this._writer = writer
    this._useCache = useCache
    this._cache = {
      lastRunDate: '1970-01-01T00:00:00Z',
      allRepos: null,
      filteredWithBranches: null,
      repos: []
    }
  }

  async update (): Promise<void> {
    try {
      if (this._useCache) {
        this._cache.lastRunDate = await this.getLastRunDate()
        this._cache.allRepos = await this.getCacheFile(allReposCacheFileName)
        this._cache.filteredWithBranches = await this.getCacheFile(filteredWithBranchesCacheFileName)
      }
      // these get updated no matter what so that we can use them after running all the rules
      this._cache.repos = await this.getRepoInfoCacheFiles('repos')
    } catch (e: any) {
      logger.error(`Error parsing setting up cache (this error is not fatal), error: ${e as string}`)
    }
  }

  get cache (): CacheInfo {
    return this._cache
  }

  async getLastRunDate (): Promise<string> {
    const dateString = await this._writer.readFile('cache', 'json', lastRunDateFileName)
    const date = dateString == null ? null : JSON.parse(dateString)

    if (date == null) {
      const date = { lastRunDate: '1970-01-01T00:00:00Z' }
      await this._writer.writeFile('cache', 'json', lastRunDateFileName, stringifyJSON(date, lastRunDateFileName))
      return date.lastRunDate
    }
    return date.lastRunDate
  }

  async setLastRunDate (currentDate: Date): Promise<void> {
    try {
      const fourHoursAgo = new Date(currentDate.setHours(currentDate.getHours() - 4))
      await this._writer.writeFile('cache', 'json', lastRunDateFileName, stringifyJSON({ lastRunDate: fourHoursAgo.toISOString() }, lastRunDateFileName))
    } catch (error) {
      errorHandler(error, this.setLastRunDate.name)
    }
  }

  async getCacheFile (fileName: string): Promise<CacheFile | null> {
    try {
      const fileString = await this._writer.readFile('cache', 'json', fileName)
      if (fileString != null) {
        const file = JSON.parse(fileString)
        if (validCacheFile.Check(file)) {
          return file
        }
        logger.error(`Invalid CacheFile found for ${fileName}.json`)
      }
      return null
    } catch (e: any) {
      logger.error(`Error parsing CacheFile: ${fileName}, error: ${e as string}`)
      return null
    }
  }

  async getRepoInfoCacheFiles (directoryName: string): Promise<Repo[]> {
    const repoInfoCacheFiles = await this._writer.readAllFilesInDirectory('cache', 'json', directoryName)
    const repos: Repo[] = []
    if (repoInfoCacheFiles != null) {
      for (const repoInfoFile in repoInfoCacheFiles) {
        const repoInfoString = repoInfoCacheFiles[repoInfoFile]
        if (repoInfoString != null) {
          try {
            const repoInfo = JSON.parse(repoInfoString)
            if (validRepo.Check(repoInfo)) {
              repos.push(repoInfo)
            } else {
              logger.error(`Invalid RepoInfo found for ${repoInfoFile}`)
            }
          } catch (e: any) {
            logger.error(`Error parsing RepoInfo file: ${repoInfoFile}, error: ${e as string}`)
          }
        }
      }
    }
    return repos
  }

  async writeFileToCache (filePath: string, body: CacheFile | Repo): Promise<void> {
    logger.info(`Writing file to cache: ${filePath}`)
    await this._writer.writeFile('cache', 'json', filePath, stringifyJSON(body, filePath))
  }
}
