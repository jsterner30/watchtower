import { FileTypeEnum, PackageJsonFile, RuleFile, validPackageJsonFile } from '../../../../types'
import { removeComparatorsInVersion } from '../../../../util'

export interface NPMDependencyParts {
  name: string
  version: string
}

export default function (ruleFile: RuleFile): NPMDependencyParts[] {
  const parts: NPMDependencyParts[] = []
  if (validPackageJsonFile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.PACKAGE_JSON) {
    const allDeps: Record<string, string> = combineDeps(ruleFile)

    for (const name in allDeps) {
      const dependencyName = name.replace(/\//g, '_') // slashes in dep name will mess with file structure
      if (!(allDeps[name]).includes('file:')) { // we don't care about intra-repo dependencies
        parts.push({
          name: dependencyName,
          version: removeComparatorsInVersion(allDeps[name])
        })
      }
    }
  }
  return parts
}

function combineDeps (ruleFile: PackageJsonFile): Record<string, string> {
  let allDeps: Record<string, string> = {}
  if (ruleFile.dependencies != null) {
    allDeps = { ...allDeps, ...ruleFile.dependencies }
  }
  if (ruleFile.peerDependencies != null) {
    allDeps = { ...allDeps, ...ruleFile.peerDependencies }
  }
  if (ruleFile.peerDependencies != null) {
    allDeps = { ...allDeps, ...ruleFile.devDependencies }
  }
  return allDeps
}
