import {
  type RepoInfo,
  type ReportFunction,
  validGHAFile, validTerraformFile, FileTypeEnum
} from '../types'
import { compare, validate } from 'compare-versions'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'

export const terraformVersionReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const startingLowestVersion = '100.0.0'
  const startingHighestVersion = '0.0.0'

  const repoHeader = [
    { id: 'repoName', title: 'Repo' },
    { id: 'lowestVersion', title: 'Lowest Version' },
    { id: 'highestVersion', title: 'Highest Version' }
  ]

  const branchHeader = [
    { id: 'repoName', title: 'Repo' },
    { id: 'branchName', title: 'Branch' },
    { id: 'lowestVersion', title: 'Lowest Version' },
    { id: 'highestVersion', title: 'Highest Version' }
  ]

  // this report lists every branch that has terraform on it as a single row
  const allBranchesWriter = new ReportDataWriter('./src/data/reports/terraform/TerraformVersionReport-AllBranches.csv', branchHeader)

  // this report lists every non-stale branch that has terraform on it as a single row
  const nonStaleBranchesWriter = new ReportDataWriter('./src/data/reports/terraform/TerraformVersionReport-NonStaleBranches.csv', branchHeader)

  // this report lists every repo that has terraform on it as a single row, giving the lowest/highest version on any branch of the repo
  const allReposWriter = new ReportDataWriter('./src/data/reports/terraform/TerraformVersionReport-Repos-AllBranches.csv', repoHeader)

  // this report lists every repo that has terraform on it as a single row, giving the lowest/highest version on any non-stale branch of the repo
  const nonStaleReposWriter = new ReportDataWriter('./src/data/reports/terraform/TerraformVersionReport-Repos-NonStaleBranches.csv', repoHeader)

  for (const repo of repos) {
    const repoAllBranchesNodeReport = {
      repoName: repo.name,
      lowestVersion: startingLowestVersion,
      highestVersion: startingHighestVersion
    }
    const repoNonStaleBranchesNodeReport = {
      repoName: repo.name,
      lowestVersion: startingLowestVersion,
      highestVersion: startingHighestVersion
    }

    for (const branchName in repo.branches) {
      try {
        const branchTerraformFiles: Array<Record<string, any>> = []

        for (const dep of repo.branches[branchName].deps) {
          if (validTerraformFile.Check(dep) && dep.fileType === FileTypeEnum.TERRAFORM) {
            // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
            if (dep.contents.terraform?.[0]?.required_version != null) {
              branchTerraformFiles.push({
                fileName: dep.fileName,
                version: removeComparatorsInVersion(dep.contents.terraform?.[0].required_version)
              })
            }
          } else if (validGHAFile.Check(dep) && dep.fileType === FileTypeEnum.GITHUB_ACTION) {
            if (dep.contents.env?.tf_version != null) {
              branchTerraformFiles.push({ fileName: dep.fileName, version: removeComparatorsInVersion(dep.contents.env.tf_version) })
            }
          }
        }

        if (branchTerraformFiles.length === 0) {
          // no node files in repo branch
          continue
        }

        let lowestVersion = startingLowestVersion
        let highestVersion = startingHighestVersion
        const terraformBranchReport: Record<string, any> = {
          repoName: repo.name,
          branchName
        }

        for (const versionFile of branchTerraformFiles) {
          if (validate(versionFile.version)) {
            if (compare(lowestVersion, versionFile.version, '>')) {
              lowestVersion = versionFile.version
            }
            if (compare(highestVersion, versionFile.version, '<')) {
              highestVersion = versionFile.version
            }
          }
        }
        terraformBranchReport.lowestVersion = lowestVersion
        terraformBranchReport.highestVersion = highestVersion

        if (lowestVersion !== startingLowestVersion && highestVersion !== startingHighestVersion) {
          if (!repo.branches[branchName].staleBranch) {
            nonStaleBranchesWriter.data.push(terraformBranchReport)
            if (compare(terraformBranchReport.lowestVersion, repoNonStaleBranchesNodeReport.lowestVersion, '<')) {
              repoNonStaleBranchesNodeReport.lowestVersion = terraformBranchReport.lowestVersion
            }
            if (compare(terraformBranchReport.highestVersion, repoNonStaleBranchesNodeReport.highestVersion, '>')) {
              repoNonStaleBranchesNodeReport.highestVersion = terraformBranchReport.highestVersion
            }
          }
          if (compare(terraformBranchReport.lowestVersion, repoAllBranchesNodeReport.lowestVersion, '<')) {
            repoAllBranchesNodeReport.lowestVersion = terraformBranchReport.lowestVersion
          }
          if (compare(terraformBranchReport.highestVersion, repoAllBranchesNodeReport.highestVersion, '>')) {
            repoAllBranchesNodeReport.highestVersion = terraformBranchReport.highestVersion
          }
          allBranchesWriter.data.push(terraformBranchReport)
        }

        if (repoNonStaleBranchesNodeReport.highestVersion !== startingHighestVersion && repoNonStaleBranchesNodeReport.lowestVersion !== startingLowestVersion) {
          nonStaleReposWriter.data.push(repoNonStaleBranchesNodeReport)
        }
        if (repoAllBranchesNodeReport.highestVersion !== startingHighestVersion && repoAllBranchesNodeReport.lowestVersion !== startingLowestVersion) {
          allReposWriter.data.push(repoAllBranchesNodeReport)
        }
      } catch (error) {
        errorHandler(error, terraformVersionReport.name, repo.name, branchName)
      }
    }
  }

  await allBranchesWriter.write()
  await nonStaleBranchesWriter.write()
  await allReposWriter.write()
  await nonStaleReposWriter.write()
}

function removeComparatorsInVersion (version: string): string {
  let curVer = version

  const firstChar = version.at(0)
  if (firstChar != null) {
    if (!(isNumericChar(firstChar))) {
      let i = 0
      for (const letter of version) {
        if (isNumericChar(letter)) {
          break
        }
        ++i
      }
      curVer = version.substring(i)
    }
  }
  return curVer
}

function isNumericChar (c: string): boolean { return /\d/.test(c) }
