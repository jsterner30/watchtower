import { GradeEnum, HealthScore, RepoInfo } from '../types'
import { arrayToObject, getOverallGPAScore } from './util'
import { compare, validate } from 'compare-versions'
import { startingHighestVersion, startingLowestVersion } from './constants'
import { ReportOutputData } from './reportOutputData'

export const getRelativeReportGrades = (reportOutputs: Record<string, ReportOutputData>, repos: RepoInfo[], reportName: string, reportWeight: number): void => {
  const relativeGrades: Record<string, HealthScore[]> = {}
  for (const repo of repos) {
    relativeGrades[repo.name] = []
  }

  for (const depName in reportOutputs) {
    const uniqueRepos = getUniqueReposInWriterData(reportOutputs[depName].data)
    if (uniqueRepos.size === 1) {
      const onlyRepoName = [...uniqueRepos][0]
      relativeGrades[onlyRepoName].push({
        grade: GradeEnum.C, // we give a C to repos using dependencies that no one else uses
        weight: 1
      })
    } else {
      let highestVersion = startingHighestVersion
      let lowestVersion = startingLowestVersion
      for (const row of reportOutputs[depName].data) {
        if (row.version === 'latest') {
          relativeGrades[row.repoName].push({
            grade: GradeEnum.B,
            weight: 1
          })
        } else if (validate(row.version)) {
          if (compare(row.version, highestVersion, '>')) {
            highestVersion = row.version
          }
          if (compare(row.version, lowestVersion, '<')) {
            lowestVersion = row.version
          }
        }
      }
      for (const row of reportOutputs[depName].data) {
        if (highestVersion !== startingHighestVersion && lowestVersion !== startingLowestVersion) {
          if (validate(row.version)) {
            relativeGrades[row.repoName].push(getGradeFromHighest(highestVersion, lowestVersion, row.version))
          }
        }
      }
    }
  }

  for (const repo of repos) {
    if (relativeGrades[repo.name].length !== 0) {
      const obj = arrayToObject(relativeGrades[repo.name])
      const totalGrade = getOverallGPAScore(obj)
      repo.healthScores[reportName] = {
        grade: numberToGrade(totalGrade),
        weight: reportWeight
      }
    } else {
      repo.healthScores[reportName] = {
        grade: GradeEnum.NotApplicable,
        weight: 0
      }
    }
  }
}

export const getGradeFromHighest = (highestVersion: string, lowestVersion: string, currentVersion: string): HealthScore => {
  let highMajor = highestVersion.split('.')[0]
  let lowMajor = lowestVersion.split('.')[0]
  let curMajor = currentVersion.split('.')[0]

  highMajor = highMajor.includes('v') ? highMajor.split('v')[1] : highMajor
  lowMajor = lowMajor.includes('v') ? lowMajor.split('v')[1] : lowMajor
  curMajor = curMajor.includes('v') ? curMajor.split('v')[1] : curMajor

  const spread = (parseInt(highMajor) - parseInt(lowMajor)) / 5
  const majorDif = parseInt(highMajor) - parseInt(curMajor)
  if (majorDif < spread) {
    return {
      grade: GradeEnum.A,
      weight: 1
    }
  } else if (majorDif < 2 * spread) {
    return {
      grade: GradeEnum.B,
      weight: 1
    }
  } else if (majorDif < 3 * spread) {
    return {
      grade: GradeEnum.C,
      weight: 1
    }
  } else if (majorDif < 4 * spread) {
    return {
      grade: GradeEnum.D,
      weight: 1
    }
  } else {
    return {
      grade: GradeEnum.F,
      weight: 1
    }
  }
}

export function getUniqueReposInWriterData (outPutData: Array<Record<string, any>>): Set<string> {
  const repoSet: Set<string> = new Set()
  for (const row of outPutData) {
    if (!repoSet.has(row.repoName)) {
      repoSet.add(row.repoName)
    }
  }
  return repoSet
}

function numberToGrade (num: number): GradeEnum {
  if (num > 3.5) {
    return GradeEnum.A
  } else if (num > 2.5) {
    return GradeEnum.B
  } else if (num > 1.5) {
    return GradeEnum.C
  } else if (num > 0.5) {
    return GradeEnum.D
  } else {
    return GradeEnum.F
  }
}
