import { FileTypeEnum, RuleFile, validTerraformFile } from '../../../../types'
import { errorHandler } from '../../../../util'

export interface TerraformModuleParts {
  name: string
  version: string
}

export default function (ruleFile: RuleFile): TerraformModuleParts[] {
  const parts: TerraformModuleParts[] = []
  try {
    if (validTerraformFile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.TERRAFORM) {
      if (ruleFile.contents.module != null) {
        for (const moduleRef in ruleFile.contents.module) {
          const module = ruleFile.contents.module[moduleRef]
          if (module?.[0]?.source.includes('github') as boolean) {
            const splitUrl = module[0].source.split('?ref=')
            const moduleNameUrl = splitUrl[0].split('/')
            const moduleName: string = moduleNameUrl[moduleNameUrl.length - 1]
            const version = splitUrl[1]
            if (moduleName !== 'terraform-aws-<module_name>') {
              parts.push({
                name: moduleName,
                version
              })
            }
          }
        }
      }
    }
  } catch (error) {
    errorHandler(error, 'getTerraformModulePartsFromFile')
  }
  return parts
}
