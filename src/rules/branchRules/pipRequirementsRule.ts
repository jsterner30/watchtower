import { FileTypeEnum, PIPDependency, PIPRequirementsFile, Repo } from '../../types'
import { errorHandler } from '../../util'
import { BranchRule } from '../rule'
import JSZip from 'jszip'

export class PIPRequirementsRule extends BranchRule {
  async run (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (downloaded.files[fileName].name.endsWith('requirements.txt')) {
        repo.branches[branchName].ruleFiles.push(this.parseRequirementsTXT(await downloaded.files[fileName].async('string'), fileName))
      }
    } catch (error) {
      errorHandler(error, PIPRequirementsRule.name, repo.name, branchName, fileName)
    }
  }

  parseRequirementsTXT (requirementsContent: string, fileName: string): PIPRequirementsFile {
    const dependencies: Record<string, PIPDependency> = {}
    const lines = requirementsContent.split('\n')
    lines.forEach((line) => {
      if (line.trim() !== '' && !line.trim().startsWith('#')) {
        // Find the index of the first character that represents the version comparator
        const comparatorIndex = line.search(/[=<>~!]/)
        if (comparatorIndex !== -1) {
          const dependency = line.substring(0, comparatorIndex).trim()
          const version = line.substring(comparatorIndex).trim()
          dependencies[dependency] = { dependency, version }
        } else {
          // If no version comparator is found, assume it's an exact match
          dependencies[line.trim()] = { dependency: line.trim(), version: '' }
        }
      }
    })
    return {
      fileName,
      fileType: FileTypeEnum.PIP_REQUIREMENTS,
      dependencies
    }
  }
}
