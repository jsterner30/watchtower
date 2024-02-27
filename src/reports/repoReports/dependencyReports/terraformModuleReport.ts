import {
  type Repo,
  validTerraformFile,
  FileTypeEnum
} from '../../../types'
import { errorHandler, HeaderTitles, ReportWriter } from '../../../util'
import { DependencyReport, DependencyReportWriters } from './dependencyReport'
import { RepoReportData } from '../repoReport'

interface TerraformModuleReportData extends RepoReportData {
  repoName: string
  branchName: string
  version: string
}

export class TerraformModuleReport extends DependencyReport<TerraformModuleReportData> {
  protected async runReport (repo: Repo, writers: DependencyReportWriters<any>): Promise<void> {
    for (const branchName in repo.branches) {
      try {
        for (let i = 0; i < repo.branches[branchName].deps.length; ++i) {
          const dep = repo.branches[branchName].deps[i]
          if (validTerraformFile.Check(dep) && dep.fileType === FileTypeEnum.TERRAFORM) {
            if (dep.contents.module != null) {
              for (const moduleRef in dep.contents.module) {
                const module = dep.contents.module[moduleRef]
                if (module?.[0]?.source.includes('github') as boolean) {
                  const splitUrl = module[0].source.split('?ref=')
                  const moduleNameUrl = splitUrl[0].split('/')
                  const moduleName: string = moduleNameUrl[moduleNameUrl.length - 1]
                  const version = splitUrl[1]
                  if (moduleName !== 'terraform-aws-<module_name>') {
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
      } catch (error) {
        errorHandler(error, TerraformModuleReport.name, repo.name, branchName)
      }
    }
  }

  protected getHeaderTitles (): HeaderTitles<any> {
    return {
      repoName: 'Repo',
      branchName: 'Branch',
      version: 'Version'
    }
  }

  public get name (): string {
    return TerraformModuleReport.name
  }
}
