import {
    Grade, GradeEnum, HealthScore, validReadmeFile,
    type RepoInfo,
    type ReportFunction
  } from '../types'
  import ReportDataWriter from '../util/reportDataWriter'
  import { errorHandler } from '../util'
  import { readmeReportGradeWeight, readmeReportGradeName } from '../util/constants'

  // TODO: maye move somewhere
  type ContentItem = {
    type: string
    tag: string
    content?: string
    children?: ContentItem[]
  }

  function hasTitleAndCountHeadings(contents: ContentItem[]): { hasTitle: boolean, appHeadingCount: number, libHeadingCount: number } {
    let hasTitle = false
    let appHeadingCount = 0
    let libHeadingCount = 0
    let isCheckingHeading = false

    const appSections = ['Overview', 'How to Run Locally', 'How to Deploy', 'How to Use This', 'Architectural Overview']
    const libSections = ['Overview', 'How to Use This', 'How to Build Locally', 'How to Publish', 'Architectural Overview']
    
  
    for (let i = 0; i < contents.length; i++) {
      const item = contents[i]
  
      if (item.type === 'heading_open' && (item.tag === 'h1' || item.tag === 'h2')) {
        isCheckingHeading = true
        // Check if the next item is an inline element with text content
        const nextItem = contents[i + 1]
        const headingContent = nextItem?.type === 'inline' && nextItem.children?.[0]?.type === 'text' && nextItem.children[0].content
  
        if (headingContent && appSections.includes(headingContent)) {
          // Found "Overview" or "Usage" heading, start counting
          for (let j = i + 3; j < contents.length; j++) {
            const subsequentItem = contents[j]
  
            if (
              (subsequentItem.type === 'inline' && subsequentItem.children && subsequentItem.children.length > 0) ||
              (subsequentItem.type === 'text' && subsequentItem.content)
            ) {
              appHeadingCount++
              break
            }
  
            // Stop checking after processing the first inline or text element
            if (subsequentItem.type === 'heading_open' && (subsequentItem.tag === 'h1' || subsequentItem.tag === 'h2')) {
              break
            }
          }
        }
      }
  
      if (isCheckingHeading && (item.type === 'inline' || item.type === 'text')) {
        hasTitle = true
        // Stop checking after processing the first inline or text element
        isCheckingHeading = false
      }
    }

    isCheckingHeading = false
    // TODO: maybe do app and lib at same time
    for (let i = 0; i < contents.length; i++) {
      const item = contents[i]
  
      if (item.type === 'heading_open' && (item.tag === 'h1' || item.tag === 'h2')) {
        isCheckingHeading = true
        // Check if the next item is an inline element with text content
        const nextItem = contents[i + 1]
        const headingContent = nextItem?.type === 'inline' && nextItem.children?.[0]?.type === 'text' && nextItem.children[0].content
  
        if (headingContent && libSections.includes(headingContent)) {
          // Found "Overview" or "Usage" heading, start counting
          for (let j = i + 1; j < contents.length; j++) {
            const subsequentItem = contents[j]
  
            if (
              (subsequentItem.type === 'inline' && subsequentItem.children && subsequentItem.children.length > 0) ||
              (subsequentItem.type === 'text' && subsequentItem.content)
            ) {
              libHeadingCount++
              break
            }
  
            // Stop checking after processing the first inline or text element
            if (subsequentItem.type === 'heading_open' && (subsequentItem.tag === 'h1' || subsequentItem.tag === 'h2')) {
              break
            }
          }
        }
      }
  
      if (isCheckingHeading && (item.type === 'inline' || item.type === 'text')) {
        hasTitle = true
        // Stop checking after processing the first inline or text element
        isCheckingHeading = false
      }
    }
  
    return { hasTitle, appHeadingCount, libHeadingCount }
  }
  
  export const readmeReportGrade = (input: string): HealthScore => { // TODO: had NA if no readme
    const gradeMinValues: Record<number, Grade> = {
      0: GradeEnum.A,
      1: GradeEnum.B,
      2: GradeEnum.C,
      3: GradeEnum.D,
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
      { id: 'hasTitle', title: 'Has Title' },
      { id: 'numSectionsMissing', title: '# of missing required sections' }
    ]
    const dependabotReportWriter = new ReportDataWriter('./data/reports/ReadmeReport.csv', header) // TODO: capitalize file

    const appSections = ['Overview', 'How to Run Locally', 'How to Deploy', 'How to Use This', 'Architectural Overview']
    const libSections = ['Overview', 'How to Use This', 'How to Build Locally', 'How to Publish', 'Architectural Overview']
  
    for (const repo of repos) {
      let hasReadme = false
      let hasTitleTemp = false
      let numSections = 0

      for (const dep of repo.branches[repo.defaultBranch].deps) {
        if (validReadmeFile.Check(dep) && dep.fileType == 'README') {
          const readmeContent = dep.contents

          if (readmeContent.length > 0) {
            hasReadme = true
          } else {
            break
          }

          const { hasTitle, appHeadingCount, libHeadingCount } = hasTitleAndCountHeadings(readmeContent as ContentItem[])
          hasTitleTemp = hasTitle
          numSections = Math.max(appHeadingCount, libHeadingCount)
        }
      }

      dependabotReportWriter.data.push({
        repoName: repo.name,
        hasReadme: hasReadme,
        hasTitle: hasTitleTemp,
        numSectionsMissing: 5 - numSections // TODO: make variable for this
      })
  
      repo.healthScores[readmeReportGradeName] = readmeReportGrade((5 - numSections).toString())
    }
  
    await dependabotReportWriter.write()
  }
  