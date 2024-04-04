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
      parts.push({
        name: name,
        version: removeComparatorsInVersion(ruleFile.dependencies[name].version)
      })
    }
  }
  return parts
}
