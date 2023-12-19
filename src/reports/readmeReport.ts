import {
    Grade, GradeEnum, HealthScore,
    type RepoInfo,
    type ReportFunction
  } from '../types'
  import ReportDataWriter from '../util/reportDataWriter'
  import { errorHandler } from '../util'
  import { readmeReportGradeWeight, readmeReportGradeName } from '../util/constants'
  
  export const readmeReportGrade = (input: string): HealthScore => {
    const gradeMinValues: Record<number, Grade> = {
      5: GradeEnum.A,
      10: GradeEnum.B,
      15: GradeEnum.C,
      20: GradeEnum.D,
      [Number.MAX_SAFE_INTEGER]: GradeEnum.F
    }
  
    for (const minValue in gradeMinValues) {
      if (parseInt(input) < parseInt(minValue)) {
        return {
          grade: gradeMinValues[minValue],
          weight: readmeReportGradeWeight
        }
      }
    }
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }
  
  export const readmeReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
    const header = [
      { id: 'repoName', title: 'Repo' },
      { id: 'hasReadme', title: 'Has Readme' },
      { id: 'numSectionsMissing', title: '# of missing required sections' }
    ]
    const dependabotReportWriter = new ReportDataWriter('./data/reports/readmeReport.csv', header) // TODO: capitalize file

    const appSections = ['Overview', 'How to Run Locally', 'How to Deploy', 'How to Use This', 'Architectural Overview']
    const libSections = ['Overview', 'How to Use This', 'How to Build Locally', 'How to Publish', 'Architectural Overview']
    // TODO: check for title, (h1 on line 1)
  
    for (const repo of repos) {
      let hasReadme = false
      let numLibrarySections = 0
      let numAppSections = 0

      dependabotReportWriter.data.push({
        repoName: repo.name,
        hasReadme: true,
        numSectionsMissing: 0
      })
      const count = 5
  
      repo.healthScores[readmeReportGradeName] = readmeReportGrade(count.toString())
    }
  
    await dependabotReportWriter.write()
  }
  