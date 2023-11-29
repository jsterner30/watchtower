import {
  type RepoInfo,
  type ReportFunction,
  validDockerfile,
  validGHAFile, FileTypeEnum, ReportGradeFunction, Grade, GradeEnum
} from '../types'
import { compare, validate } from 'compare-versions'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'

export const nodeVersionReportGrade: ReportGradeFunction = (input: string): Grade => {
  if (!validate(input)) {
    return GradeEnum.NotApplicable
  }
  const gradeMinValues: Record<string, Grade> = {
    '18.0.0': GradeEnum.A,
    '16.0.0': GradeEnum.B,
    '14.0.0': GradeEnum.C,
    '12.0.0': GradeEnum.D,
    '0.0.0': GradeEnum.F
  }

  for (const minValue in gradeMinValues) {
    if (compare(input, minValue, '>=')) {
      return gradeMinValues[minValue]
    }
  }
  return GradeEnum.NotApplicable
}

export const nodeVersionReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
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
    { id: 'highestVersion', title: 'Highest Version' },
    { id: 'unspecifiedVersion', title: 'Contains an Unspecified Version' }
  ]

  // this report lists every branch that has node on it as a single row
  const allBranchesWriter = new ReportDataWriter('./data/reports/node/NodeVersionReport-AllBranches.csv', branchHeader)

  // this report lists every non-stale branch that has node on it as a single row
  const nonStaleBranchesWriter = new ReportDataWriter('./data/reports/node/NodeVersionReport-NonStaleBranches.csv', branchHeader)

  // this report lists every repo that has mode on it as a single row, giving the lowest/highest version on any branch of the repo
  const allReposWriter = new ReportDataWriter('./data/reports/node/NodeVersionReport-Repos-AllBranches.csv', repoHeader)

  // this report lists every repo that has node on it as a single row, giving the lowest/highest version on any non-stale branch of the repo
  const nonStaleReposWriter = new ReportDataWriter('./data/reports/node/NodeVersionReport-Repos-NonStaleBranches.csv', repoHeader)

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
        const branchNodeFiles: Array<Record<string, any>> = []

        for (const dep of repo.branches[branchName].deps) {
          if (validDockerfile.Check(dep) && dep.fileType === FileTypeEnum.DOCKERFILE) {
            if (dep.image.includes('node')) {
              // The code below will return "-1" if the node version is simply "node". Else, it will return "18.13.18-slim" if the image is "node:18.13.18-slim"
              const version = dep.image.split('node')[1] === '' ? '-1' : dep.image.split('node')[1].slice(1, dep.image.split('node')[1].length)
              branchNodeFiles.push({ fileName: dep.fileName, version })
            }
          } else if (validGHAFile.Check(dep) && dep.fileType === FileTypeEnum.GITHUB_ACTION) {
            if (dep.contents.env?.node_version != null) {
              branchNodeFiles.push({ fileName: dep.fileName, version: dep.contents.env.node_version })
            }
          }
        }
        if (branchNodeFiles.length === 0) {
          // no node files in repo branch
          continue
        }

        let lowestVersion = startingLowestVersion
        let highestVersion = startingHighestVersion
        const nodeBranchReport: Record<string, any> = {
          repoName: repo.name,
          branchName,
          unspecifiedVersion: false
        }

        for (const versionFile of branchNodeFiles) {
          if (versionFile.version === '-1') {
            nodeBranchReport.unspecifiedVersion = true
          } else if (validate(versionFile.version)) {
            if (compare(lowestVersion, versionFile.version, '>')) {
              lowestVersion = versionFile.version
            }
            if (compare(highestVersion, versionFile.version, '<')) {
              highestVersion = versionFile.version
            }
          }
        }
        nodeBranchReport.lowestVersion = lowestVersion
        nodeBranchReport.highestVersion = highestVersion

        if (lowestVersion !== startingLowestVersion && highestVersion !== startingHighestVersion) {
          if (!repo.branches[branchName].staleBranch) {
            nonStaleBranchesWriter.data.push(nodeBranchReport)
            if (compare(nodeBranchReport.lowestVersion, repoNonStaleBranchesNodeReport.lowestVersion, '<')) {
              repoNonStaleBranchesNodeReport.lowestVersion = nodeBranchReport.lowestVersion
            }
            if (compare(nodeBranchReport.highestVersion, repoNonStaleBranchesNodeReport.highestVersion, '>')) {
              repoNonStaleBranchesNodeReport.highestVersion = nodeBranchReport.highestVersion
            }
          }
          if (compare(nodeBranchReport.lowestVersion, repoAllBranchesNodeReport.lowestVersion, '<')) {
            repoAllBranchesNodeReport.lowestVersion = nodeBranchReport.lowestVersion
          }
          if (compare(nodeBranchReport.highestVersion, repoAllBranchesNodeReport.highestVersion, '>')) {
            repoAllBranchesNodeReport.highestVersion = nodeBranchReport.highestVersion
          }
          allBranchesWriter.data.push(nodeBranchReport)
        }

        if (repoNonStaleBranchesNodeReport.highestVersion !== startingHighestVersion && repoNonStaleBranchesNodeReport.lowestVersion !== startingLowestVersion) {
          nonStaleReposWriter.data.push(repoNonStaleBranchesNodeReport)
        }
        if (repoAllBranchesNodeReport.highestVersion !== startingHighestVersion && repoAllBranchesNodeReport.lowestVersion !== startingLowestVersion) {
          allReposWriter.data.push(repoAllBranchesNodeReport)
        }
      } catch (error) {
        errorHandler(error, nodeVersionReport.name, repo.name, branchName)
      }
    }
    repo.healthScores.nodeVersionReportGrade = nodeVersionReportGrade(repoNonStaleBranchesNodeReport.lowestVersion)
  }

  await allBranchesWriter.write()
  await nonStaleBranchesWriter.write()
  await allReposWriter.write()
  await nonStaleReposWriter.write()
}
