import {
  type RepoInfo,
  validGHAFile, validTerraformFile, FileTypeEnum, Grade, GradeEnum, HealthScore, VersionLocation
} from '../../types'
import { compare, validate } from 'compare-versions'
import {
  errorHandler, getExtremeVersions, removeComparatorsInVersion, ReportOutputData,
  startingHighestVersion,
  startingLowestVersion
} from '../../util'

import { Report } from '../report'

export class TerraformVersionReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    // TODO fetch terrraform LTS

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
    const allBranchesOutput = new ReportOutputData(branchHeader, this._outputDir, 'TerraformVersionReport-AllBranches')
    // this report lists every non-stale branch that has terraform on it as a single row
    const nonStaleBranchesOutput = new ReportOutputData(branchHeader, this._outputDir, 'TerraformVersionReport-NonStaleBranches')
    // this report lists every repo that has terraform on it as a single row, giving the lowest/highest version on any branch of the repo
    const allBranchesRepoOutput = new ReportOutputData(repoHeader, this._outputDir, 'TerraformVersionReport-Repos-AllBranches')
    // this report lists every repo that has terraform on it as a single row, giving the lowest/highest version on any non-stale branch of the repo
    const nonStaleBranchesRepoOutput = new ReportOutputData(repoHeader, this._outputDir, 'TerraformVersionReport-Repos-NonStaleBranches')
    // this report lists every repo that has node on it as a single row, giving the lowest/highest version on the default branch of the repo
    const defaultBranchRepoOutput = new ReportOutputData(branchHeader, this._outputDir, 'NodeVersionReport-Repos-DefaultBranches')

    for (const repo of repos) {
      // we add each most extreme version on every branch to these arrays, then use them to get the highest and lowest versions in the whole repo
      const nonStaleBranchVersionLocationsExtremes: VersionLocation[] = []
      const allBranchVersionLocationsExtremes: VersionLocation[] = []

      for (const branchName in repo.branches) {
        try {
          const branchTerraformFiles = this.gatherTerraformFiles(repo, branchName)
          if (branchTerraformFiles.length === 0) {
            // no terraform files in repo branch
            continue
          }

          // get the lowest and highest version on the branch
          const branchExtremeVersions = getExtremeVersions(branchTerraformFiles)

          // if the lowest and highest versions have not changed, there was versioned node on the branch
          if (branchExtremeVersions.lowestVersion !== startingLowestVersion && branchExtremeVersions.highestVersion !== startingHighestVersion) {
            // add data to both reports that only care about non-stale branches
            if (!repo.branches[branchName].staleBranch) {
              // push both highest and lowest version from each branch to an array to get the overall later (in the LocationVersion format we expect)
              nonStaleBranchVersionLocationsExtremes.push({
                location: branchName,
                version: branchExtremeVersions.lowestVersion
              })
              nonStaleBranchVersionLocationsExtremes.push({
                location: branchName,
                version: branchExtremeVersions.highestVersion
              })
              nonStaleBranchesOutput.addRow({ repoName: repo.name, branchName, lowestVersion: branchExtremeVersions.lowestVersion, highestVersion: branchExtremeVersions.highestVersion })
            }

            if (repo.branches[branchName].defaultBranch) {
              defaultBranchRepoOutput.addRow({ repoName: repo.name, branchName, lowestVersion: branchExtremeVersions.lowestVersion, highestVersion: branchExtremeVersions.highestVersion })
            }

            // now add extremes for all branches, not just stale
            allBranchVersionLocationsExtremes.push({
              location: branchName,
              version: branchExtremeVersions.lowestVersion
            })
            allBranchVersionLocationsExtremes.push({
              location: branchName,
              version: branchExtremeVersions.highestVersion
            })
            allBranchesOutput.addRow({ repoName: repo.name, branchName, lowestVersion: branchExtremeVersions.lowestVersion, highestVersion: branchExtremeVersions.highestVersion })
            repo.branches[branchName].reportResults.lowTerraformVersion = branchExtremeVersions.lowestVersion
            repo.branches[branchName].reportResults.highTerraformVersion = branchExtremeVersions.highestVersion
          }
        } catch (error) {
          errorHandler(error, TerraformVersionReport.name, repo.name, branchName)
        }
      }

      // now that we have iterated over all branches, calculate the overall extrema for the repo
      const nonStaleBranchRepoExtrema = getExtremeVersions(nonStaleBranchVersionLocationsExtremes)
      if (nonStaleBranchRepoExtrema.highestVersion !== startingHighestVersion && nonStaleBranchRepoExtrema.lowestVersion !== startingLowestVersion) {
        nonStaleBranchesRepoOutput.addRow({
          repoName: repo.name,
          lowestVersion: nonStaleBranchRepoExtrema.lowestVersion,
          highestVersion: nonStaleBranchRepoExtrema.highestVersion
        })
      }

      const allBranchRepoExtrema = getExtremeVersions(allBranchVersionLocationsExtremes)
      if (allBranchRepoExtrema.highestVersion !== startingHighestVersion && allBranchRepoExtrema.lowestVersion !== startingLowestVersion) {
        allBranchesRepoOutput.addRow({
          repoName: repo.name,
          lowestVersion: allBranchRepoExtrema.lowestVersion,
          highestVersion: allBranchRepoExtrema.highestVersion
        })
      }

      // we currently use the lowest version from any branch to get the overall health score for this report
      repo.healthScores[TerraformVersionReport.name] = this.grade({ lowestVersion: allBranchRepoExtrema.lowestVersion, terraformLTS: '1.5.0' })
      repo.reportResults.lowTerraformVersion = allBranchRepoExtrema.lowestVersion
      repo.reportResults.highTerraformVersion = allBranchRepoExtrema.highestVersion
    }

    this._reportOutputs.push(nonStaleBranchesRepoOutput)
    this._reportOutputs.push(allBranchesRepoOutput)
    this._reportOutputs.push(nonStaleBranchesOutput)
    this._reportOutputs.push(allBranchesOutput)
  }

  grade (input: { lowestVersion: string, terraformLTS: string }): HealthScore {
    if (!validate(input.lowestVersion)) {
      return {
        grade: GradeEnum.NotApplicable,
        weight: 0
      }
    }
    const gradeMinValues: Record<string, Grade> = {
      '1.5.0': GradeEnum.A,
      '1.2.5': GradeEnum.B,
      '1.0.0': GradeEnum.C,
      '0.14.0': GradeEnum.D,
      '0.0.0': GradeEnum.F
    }

    for (const minValue in gradeMinValues) {
      if (compare(input.lowestVersion, minValue, '>=')) {
        return {
          grade: gradeMinValues[minValue],
          weight: this._weight
        }
      }
    }
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }

  gatherTerraformFiles (repo: RepoInfo, branchName: string): VersionLocation[] {
    const branchTerraformFiles: VersionLocation[] = []
    for (const dep of repo.branches[branchName].deps) {
      if (validTerraformFile.Check(dep) && dep.fileType === FileTypeEnum.TERRAFORM) {
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (dep.contents.terraform?.[0]?.required_version != null) {
          branchTerraformFiles.push({
            location: dep.fileName,
            version: removeComparatorsInVersion(dep.contents.terraform?.[0].required_version)
          })
        }
      } else if (validGHAFile.Check(dep) && dep.fileType === FileTypeEnum.GITHUB_ACTION) {
        if (dep.contents.env?.tf_version != null) {
          branchTerraformFiles.push({ location: dep.fileName, version: removeComparatorsInVersion(dep.contents.env.tf_version) })
        }
      }
    }
    return branchTerraformFiles
  }

  public get name (): string {
    return TerraformVersionReport.name
  }
}
