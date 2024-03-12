import { FileTypeEnum, Repo, validGHAFile, validTerraformFile, VersionLocation } from '../../../../types'
import { VersionUtils } from '../versionReport'
import { removeComparatorsInVersion } from '../../../../util'

export class TerraformVersionUtils extends VersionUtils {
  public gatherSoftwareFiles (repo: Repo, branchName: string): VersionLocation[] {
    const branchTerraformFiles: VersionLocation[] = []
    for (const ruleFile of repo.branches[branchName].ruleFiles) {
      if (validTerraformFile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.TERRAFORM) {
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (ruleFile.contents.terraform?.[0]?.required_version != null) {
          branchTerraformFiles.push({
            filePath: ruleFile.fileName,
            version: removeComparatorsInVersion(ruleFile.contents.terraform?.[0].required_version),
            branch: branchName
          })
        }
      } else if (validGHAFile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.GITHUB_ACTION) {
        if (ruleFile.contents.env?.tf_version != null) {
          branchTerraformFiles.push({ filePath: ruleFile.fileName, version: removeComparatorsInVersion(ruleFile.contents.env.tf_version), branch: branchName })
        }
      }
    }
    return branchTerraformFiles
  }

  public get name (): string {
    return TerraformVersionUtils.name
  }
}
