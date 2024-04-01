import { Writer } from './writer'
import { Repo, validRepo } from '../types'
import { logger } from './logger'
import { stringifyJSON } from './util'

export class Cache {
  private readonly _writer: Writer
  private _repoList: string[] | null

  constructor (writer: Writer) {
    this._writer = writer
    this._repoList = []
  }

  async setup (): Promise<void> {
    await this.initRepoList()
  }

  get repoList (): string[] {
    if (this._repoList == null) {
      throw new Error('Cache repoList has not been initialized. Run cache.setup()')
    }
    return this._repoList
  }

  private async initRepoList (): Promise<void> {
    this._repoList = []
    const repoFilesName = await this._writer.listAllFilesInDirectory('cache', 'json', 'repos')
    for (const repoFileName of repoFilesName) {
      const pathRemoved = (repoFileName.split('/'))[repoFileName.split('/').length - 1]
      this._repoList.push(pathRemoved.split('.json')[0])
    }

    this._repoList.sort()
  }

  async getRepo (repoName: string): Promise<Repo | null> {
    const repoInfoFile = `${repoName}.json`
    const repoString = await this._writer.readFile('cache', 'json', `repos/${repoInfoFile}`)
    if (repoString != null) {
      try {
        const repoInfo = JSON.parse(repoString)
        if (validRepo.Check(repoInfo)) {
          return repoInfo
        } else {
          logger.error(`Invalid RepoInfo found for ${repoInfoFile}`)
          return null
        }
      } catch (error) {
        logger.error(`Error parsing RepoInfo file: ${repoInfoFile}, error: ${(error as Error).message}`)
        return null
      }
    }
    return null
  }

  async writeReposToCache (repos: Record<string, Repo>): Promise<void> {
    // get rid of the current cache repos
    await this.deleteAllFilesInCache()
    for (const repo of Object.values(repos)) {
      await this.writeRepoToCache(repo)
    }
    await this.initRepoList()
  }

  async deleteAllFilesInCache (): Promise<void> {
    await this._writer.deleteAllFilesInDirectory('cache', 'json', '')
  }

  async writeFileToCache (dataType: string, filePath: string, body: string): Promise<void> {
    await this._writer.writeFile('cache', dataType, filePath, body)
  }

  async writeRepoToCache (repo: Repo): Promise<void> {
    const filePath = `repos/${repo.name}.json`
    logger.info(`Writing file to cache: ${repo.name}`)
    await this._writer.writeFile('cache', 'json', filePath, stringifyJSON(repo, filePath))
  }
}
