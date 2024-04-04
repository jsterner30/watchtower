import { FileTypeEnum, RuleFile, validGHAFile } from '../../../../types'

export interface GHActionModuleParts {
  name: string
  version: string
}

export default function (ruleFile: RuleFile): GHActionModuleParts[] {
  const parts: GHActionModuleParts[] = []
  if (validGHAFile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.GITHUB_ACTION) {
    if (ruleFile.contents.jobs != null) {
      for (const jobName in ruleFile.contents.jobs) {
        if (ruleFile.contents.jobs[jobName].steps != null) {
          for (const step of ruleFile.contents.jobs[jobName].steps) {
            if (step.uses != null) {
              const moduleString = step.uses.split('@')
              if (moduleString[1] != null) {
                const moduleName: string = moduleString[0]
                const version = moduleString[1]
                parts.push({
                  name: moduleName,
                  version
                })
              }
            }
          }
        }
      }
    }
  }
  return parts
}
