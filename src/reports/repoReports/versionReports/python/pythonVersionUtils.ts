import { FileTypeEnum, Repo, validDockerfile, validTerraformFile, VersionLocation } from '../../../../types'
import { VersionUtils } from '../versionReport'

export class PythonVersionUtils extends VersionUtils {
  public gatherSoftwareFiles (repo: Repo, branchName: string): VersionLocation[] {
    let branchPythonFiles: VersionLocation[] = []
    for (const ruleFile of repo.branches[branchName].ruleFiles) {
      if (validDockerfile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.DOCKERFILE) {
        branchPythonFiles = [...branchPythonFiles, ...this.getDockerfileImageVersion(ruleFile, branchName, 'python')]
      } else if (validTerraformFile.Check(ruleFile) && ruleFile.fileType === 'TERRAFORM') {
        branchPythonFiles = [...branchPythonFiles, ...this.getTerraformLambdaRuntimeVersion(ruleFile, branchName, 'python')]
      }
    }
    return branchPythonFiles
  }

  public get name (): string {
    return PythonVersionUtils.name
  }
}
