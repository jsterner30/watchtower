import {
  type Repo,
  validGHAFile,
  FileTypeEnum
} from '../../../types'
import { errorHandler, HeaderTitles, ReportWriter } from '../../../util'
import { DependencyReport, DependencyReportWriters } from './dependencyReport'
import { RepoReportData } from '../repoReport'

interface GHActionModuleReportData extends RepoReportData {
  repoName: string
  branchName: string
  version: string
}

export class GHActionModuleReport extends DependencyReport<GHActionModuleReportData> {
  protected async runReport (repo: Repo, writers: DependencyReportWriters<GHActionModuleReportData>): Promise<void> {
    for (const branchName in repo.branches) {
      try {
        for (const dep of repo.branches[branchName].deps) {
          if (validGHAFile.Check(dep) && dep.fileType === FileTypeEnum.GITHUB_ACTION) {
            if (dep.contents.jobs != null) {
              for (const jobName in dep.contents.jobs) {
                if (dep.contents.jobs[jobName].steps != null) {
                  for (const step of dep.contents.jobs[jobName].steps) {
                    if (step.uses != null) {
                      const moduleString = step.uses.split('@')
                      if (moduleString[1] != null) {
                        const moduleName: string = moduleString[0].replace(/\//g, '_') // slashes or action name will mess with file structure
                        const version = moduleString[1]
                        if (writers[moduleName] == null) {
                          writers[moduleName] = new ReportWriter(this.getHeaderTitles(), this._outputDir, moduleName)
                        }

                        writers[moduleName].addRow({
                          repoName: repo.name,
                          branchName,
                          version
                        })
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        errorHandler(error, GHActionModuleReport.name, repo.name, branchName)
      }
    }
  }

  protected getHeaderTitles (): HeaderTitles<GHActionModuleReportData> {
    return {
      repoName: 'Repo',
      branchName: 'Branch',
      version: 'Version'
    }
  }

  public get name (): string {
    return GHActionModuleReport.name
  }
}
