import {
  type RepoInfo,
  FileTypeEnum,
  Grade,
  GradeEnum,
  HealthScore,
  VersionLocation,
  validDockerfile,
  validGHAFile, validTerraformFile
} from '../../types'
import { compare, validate } from 'compare-versions'
import {
  errorHandler, fetchNodeLTSVersion, getExtremeVersions, ReportOutputData, startingLowestVersion,
  startingHighestVersion
} from '../../util'
import { Report } from '../report'

export class NodeVersionReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const nodeLTS = await fetchNodeLTSVersion()

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

    // this report lists every branch that has node on it as a single row
    const allBranchesOutput = new ReportOutputData(branchHeader, this._outputDir, 'NodeVersionReport-AllBranches')
    // this report lists every non-stale branch that has node on it as a single row
    const nonStaleBranchesOutput = new ReportOutputData(branchHeader, this._outputDir, 'NodeVersionReport-NonStaleBranches')
    // this report lists every repo that has mode on it as a single row, giving the lowest/highest version on any branch of the repo
    const allBranchesRepoOutput = new ReportOutputData(repoHeader, this._outputDir, 'NodeVersionReport-Repos-AllBranches')
    // this report lists every repo that has node on it as a single row, giving the lowest/highest version on any non-stale branch of the repo
    const nonStaleBranchesRepoOutput = new ReportOutputData(repoHeader, this._outputDir, 'NodeVersionReport-Repos-NonStaleBranches')
    // this report lists every repo that has node on it as a single row, giving the lowest/highest version on the default branch of the repo
    const defaultBranchRepoOutput = new ReportOutputData(branchHeader, this._outputDir, 'NodeVersionReport-Repos-DefaultBranches')

    for (const repo of repos) {
      // we add each most extreme version on every branch to these arrays, then use them to get the highest and lowest versions in the whole repo
      const nonStaleBranchVersionLocationsExtremes: VersionLocation[] = []
      const allBranchVersionLocationsExtremes: VersionLocation[] = []

      for (const branchName in repo.branches) {
        try {
          const branchNodeFiles = this.gatherNodeFiles(repo, branchName)
          if (branchNodeFiles.length === 0) {
            // no node files in repo branch
            continue
          }

          // get the lowest and highest version on the branch
          const branchExtremeVersions = getExtremeVersions(branchNodeFiles)

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
          }
        } catch (error) {
          errorHandler(error, NodeVersionReport.name, repo.name, branchName)
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
      repo.healthScores[NodeVersionReport.name] = this.grade({ lowestVersion: allBranchRepoExtrema.lowestVersion, nodeLTS })
    }

    this._reportOutputs.push(nonStaleBranchesRepoOutput)
    this._reportOutputs.push(allBranchesRepoOutput)
    this._reportOutputs.push(nonStaleBranchesOutput)
    this._reportOutputs.push(allBranchesOutput)
  }

  gatherNodeFiles (repo: RepoInfo, branchName: string): VersionLocation[] {
    const branchNodeFiles: VersionLocation[] = []
    for (const dep of repo.branches[branchName].deps) {
      if (validDockerfile.Check(dep) && dep.fileType === FileTypeEnum.DOCKERFILE) {
        if (dep.image.includes('node')) {
          // The code below will return "-1" if the node version is simply "node". Else, it will return "18.13.18-slim" if the image is "node:18.13.18-slim"
          const version = dep.image.split('node')[1] === '' ? '-1' : dep.image.split('node')[1].slice(1, dep.image.split('node')[1].length)
          branchNodeFiles.push({ location: dep.fileName, version })
        }
      } else if (validGHAFile.Check(dep) && dep.fileType === FileTypeEnum.GITHUB_ACTION) {
        if (dep.contents.env?.node_version != null) {
          branchNodeFiles.push({ location: dep.fileName, version: dep.contents.env.node_version })
        }
      } else if (validTerraformFile.Check(dep) && dep.fileType === 'TERRAFORM') {
        for (const moduleName in dep.contents.module) {
          for (const subModule of dep.contents.module[moduleName]) {
            if (subModule.runtime != null) {
              if ((subModule.runtime as string).includes('nodejs')) {
                branchNodeFiles.push({ location: dep.fileName, version: subModule.runtime.split('nodejs')[1] })
              }
            }
          }
        }
      }
    }
    return branchNodeFiles
  }

  grade (input: { lowestVersion: string, nodeLTS: string }): HealthScore {
    if (!validate(input.lowestVersion)) {
      return {
        grade: GradeEnum.NotApplicable,
        weight: this._weight
      }
    }

    const gradeMinValues: Record<string, Grade> = {
      [input.nodeLTS + '.0.0']: GradeEnum.A,
      [(parseInt(input.nodeLTS) - 2).toString() + '.0.0']: GradeEnum.B,
      [(parseInt(input.nodeLTS) - 4).toString() + '.0.0']: GradeEnum.C,
      [(parseInt(input.nodeLTS) - 6).toString() + '.0.0']: GradeEnum.D,
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

  public get name (): string {
    return NodeVersionReport.name
  }
}
