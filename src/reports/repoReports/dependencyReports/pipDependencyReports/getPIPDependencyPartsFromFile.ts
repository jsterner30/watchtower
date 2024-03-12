import { FileTypeEnum, RuleFile, validPIPRequirementsFile } from '../../../../types'
import { removeComparatorsInVersion } from '../../../../util'

export interface PIPDependencyParts {
  name: string
  version: string
}

export default function (ruleFile: RuleFile): PIPDependencyParts[] {
  const parts: PIPDependencyParts[] = []
  if (validPIPRequirementsFile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.PIP_REQUIREMENTS) {
    for (const name in ruleFile.dependencies) {
      const dependencyName = name.replace(/\//g, '_') // slashes in dep name will mess with file structure
      parts.push({
        name: dependencyName,
        version: removeComparatorsInVersion(ruleFile.dependencies[name].version)
      })
    }
  }
  return parts
}
