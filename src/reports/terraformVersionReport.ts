import {
  type RepoInfo,
  type ReportFunction,
  validGHAFile, validTerraformFile, FileTypeEnum, ReportGradeFunction, Grade, GradeEnum, HealthScore
} from '../types'
import { compare, validate } from 'compare-versions'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'
import { terraformVersionReportGradeWeight } from '../util/constants'

export const terraformVersionReportGrade: ReportGradeFunction = (input: string): HealthScore => {
  if (!validate(input)) {
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }
  const gradeMinValues: Record<string, Grade> = {
    '1.5.0': GradeEnum.A,
    '1.3.0': GradeEnum.B,
    '1.1.0': GradeEnum.C,
    '0.14.0': GradeEnum.D,
    '0.0.0': GradeEnum.F
  }

  for (const minValue in gradeMinValues) {
    if (compare(input, minValue, '>=')) {
      return {
        grade: gradeMinValues[minValue],
        weight: terraformVersionReportGradeWeight
      }
    }
  }
  return {
    grade: GradeEnum.NotApplicable,
    weight: 0
  }
}

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
  const allBranchesWriter = new ReportDataWriter('./data/reports/terraform/TerraformVersionReport-AllBranches.csv', branchHeader)

  // this report lists every non-stale branch that has terraform on it as a single row
  const nonStaleBranchesWriter = new ReportDataWriter('./data/reports/terraform/TerraformVersionReport-NonStaleBranches.csv', branchHeader)

  // this report lists every repo that has terraform on it as a single row, giving the lowest/highest version on any branch of the repo
  const allReposWriter = new ReportDataWriter('./data/reports/terraform/TerraformVersionReport-Repos-AllBranches.csv', repoHeader)

  // this report lists every repo that has terraform on it as a single row, giving the lowest/highest version on any non-stale branch of the repo
  const nonStaleReposWriter = new ReportDataWriter('./data/reports/terraform/TerraformVersionReport-Repos-NonStaleBranches.csv', repoHeader)

  for (const repo of repos) {
    const repoAllBranchesTerraformReport = {
      repoName: repo.name,
      lowestVersion: startingLowestVersion,
      highestVersion: startingHighestVersion
    }
    const repoNonStaleBranchesTerraformReport = {
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
            if (compare(terraformBranchReport.lowestVersion, repoNonStaleBranchesTerraformReport.lowestVersion, '<')) {
              repoNonStaleBranchesTerraformReport.lowestVersion = terraformBranchReport.lowestVersion
            }
            if (compare(terraformBranchReport.highestVersion, repoNonStaleBranchesTerraformReport.highestVersion, '>')) {
              repoNonStaleBranchesTerraformReport.highestVersion = terraformBranchReport.highestVersion
            }
          }
          if (compare(terraformBranchReport.lowestVersion, repoAllBranchesTerraformReport.lowestVersion, '<')) {
            repoAllBranchesTerraformReport.lowestVersion = terraformBranchReport.lowestVersion
          }
          if (compare(terraformBranchReport.highestVersion, repoAllBranchesTerraformReport.highestVersion, '>')) {
            repoAllBranchesTerraformReport.highestVersion = terraformBranchReport.highestVersion
          }
          allBranchesWriter.data.push(terraformBranchReport)
        }

        if (repoNonStaleBranchesTerraformReport.highestVersion !== startingHighestVersion && repoNonStaleBranchesTerraformReport.lowestVersion !== startingLowestVersion) {
          repo.healthScores.terraformVersionReportGrade = terraformVersionReportGrade(repoNonStaleBranchesTerraformReport.lowestVersion)
          nonStaleReposWriter.data.push(repoNonStaleBranchesTerraformReport)
        }
        if (repoAllBranchesTerraformReport.highestVersion !== startingHighestVersion && repoAllBranchesTerraformReport.lowestVersion !== startingLowestVersion) {
          allReposWriter.data.push(repoAllBranchesTerraformReport)
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
