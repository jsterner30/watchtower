import { FileTypeEnum, RuleFile, validPackageJsonFile } from '../../../../types'
import { removeComparatorsInVersion } from '../../../../util'

export interface NPMDependencyParts {
  name: string
  version: string
}

export default function (ruleFile: RuleFile): NPMDependencyParts[] {
  const parts: NPMDependencyParts[] = []
  if (validPackageJsonFile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.PACKAGE_JSON) {
    for (const name in ruleFile.dependencies) {
      const dependencyName = name.replace(/\//g, '_') // slashes in dep name will mess with file structure
      parts.push({
        name: dependencyName,
        version: removeComparatorsInVersion(ruleFile.dependencies[name])
      })
    }
  }
  return parts
}
