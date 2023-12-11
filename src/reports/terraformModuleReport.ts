import {
  type RepoInfo,
  type ReportFunction,
  validTerraformFile,
  FileTypeEnum,
  CSVWriterHeader
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler, getRelativeReportGrades } from '../util'
import { terraformModuleReportGradeName, terraformModuleReportGradeWeight } from '../util/constants'

export const terraformModuleReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header: CSVWriterHeader = [
    { id: 'repoName', title: 'Repo' },
    { id: 'branchName', title: 'Branch' },
    { id: 'version', title: 'Version' }
  ]

  const moduleReportWriters: Record<string, ReportDataWriter> = {}

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
                    if (moduleReportWriters[moduleName] == null) {
                      moduleReportWriters[moduleName] = new ReportDataWriter(`./data/reports/TerraformModules/${moduleName}.csv`, header)
                    }
                    moduleReportWriters[moduleName].data.push({
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
        errorHandler(error, terraformModuleReport.name, repo.name, branchName)
      }
    }
  }

  getRelativeReportGrades(moduleReportWriters, repos, terraformModuleReportGradeName, terraformModuleReportGradeWeight)
  for (const writerData in moduleReportWriters) {
    await moduleReportWriters[writerData].write()
  }
}
