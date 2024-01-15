import {
  type RepoInfo,
  validTerraformFile,
  FileTypeEnum,
  Header, HealthScore, GradeEnum
} from '../../types'
import { errorHandler, getRelativeReportGrades, ReportOutputData } from '../../util'
import { Report } from '../report'
import { logger } from '../../util/logger'

export class TerraformModuleReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const header: Header = [
      { id: 'repoName', title: 'Repo' },
      { id: 'branchName', title: 'Branch' },
      { id: 'version', title: 'Version' }
    ]

    const moduleReportOutputs: Record<string, ReportOutputData> = {}

    for (const repo of repos) {
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
                      if (moduleReportOutputs[moduleName] == null) {
                        moduleReportOutputs[moduleName] = new ReportOutputData(header, this._outputDir, moduleName)
                      }
                      moduleReportOutputs[moduleName].addRow({
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

    getRelativeReportGrades(moduleReportOutputs, repos, TerraformModuleReport.name, this._weight)
    for (const output in moduleReportOutputs) {
      this._reportOutputs.push(moduleReportOutputs[output])
    }
  }

  grade (input: unknown): HealthScore {
    logger.error('The TerraformModuleReport does not implement the grade method because it is a relative report')
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }
}
