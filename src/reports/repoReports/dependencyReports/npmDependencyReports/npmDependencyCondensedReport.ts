import { DependencyCondensedReport } from '../dependencyCondensedReport'
import { Dependency, RuleFile } from '../../../../types'
import { errorHandler, logger } from '../../../../util'
import getNPMDependencyPartsFromFile from './getNPMDependencyPartsFromFile'

export class NPMDependencyCondensedReport extends DependencyCondensedReport {
  protected getDepNames (ruleFile: RuleFile): string[] {
    const depNames = []
    try {
      const depParts = getNPMDependencyPartsFromFile(ruleFile)
      for (const dep of depParts) {
        depNames.push(dep.name)
      }
      return depNames
    } catch (error) {
      errorHandler(error, NPMDependencyCondensedReport.name)
      return []
    }
  }

  get name (): string {
    return NPMDependencyCondensedReport.name
  }

  async getNPMPackageInfo (name: string): Promise<Dependency> {
    name = name.replace('_', '/') // we removed slashes for file system reasons but need to add them back here
    try {
      const res: any = await fetch(`https://registry.npmjs.org/${name}`).then(async res => await res.json())
      if (res.error != null) {
        throw new Error(res.error)
      }
      const versions: string[] = Object.keys(res.versions as Record<string, any>)
      return {
        dependencyName: name,
        dependencyEnvironment: 'npm',
        lastModifiedDate: res.time.modified,
        createdDate: res.time.created,
        description: res.description,
        maintainerCount: res.maintainers.length,
        latestVersion: versions[versions.length - 1],
        downloadCountLastWeek: await this.getNPMPackageDownloadsPerWeek(name)
      }
    } catch (error) {
      if ((error as Error).message.toLowerCase().includes('not found')) {
        logger.warn(`Error retrieving data from NPM registry api for package: ${name}, error: ${(error as Error).message}`)
      } else {
        logger.error(`Error retrieving data from NPM registry api for package: ${name}, error: ${(error as Error).message}`)
      }
      return {
        dependencyName: name,
        dependencyEnvironment: 'npm',
        lastModifiedDate: '',
        createdDate: '',
        description: '',
        maintainerCount: -1,
        latestVersion: '',
        downloadCountLastWeek: -1
      }
    }
  }

  async getNPMPackageDownloadsPerWeek (name: string): Promise<number> {
    try {
      const res: any = await fetch(`https://api.npmjs.org/downloads/point/last-week/${name}`).then(async res => await res.json())
      return res.downloads
    } catch (error) {
      logger.error(`Error retrieving download count from NPM registry api for package: ${name}, error: ${(error as Error).message}`)
      return -1
    }
  }

  public async getDependencyInfo (packageName: string): Promise<Dependency> {
    return await this.getNPMPackageInfo(packageName)
  }
}
