import {
  Grade, GradeEnum, HealthScore, validReadmeFile, ReadmeContentItem,
  type RepoInfo
} from '../../types'
import { Report } from '../report'
import { errorHandler, ReportOutputData } from '../../util'

const appSections = ['Overview', 'How to Run Locally', 'How to Deploy', 'How to Use This', 'Architectural Overview']
const libSections = ['Overview', 'How to Use This', 'How to Build Locally', 'How to Publish', 'Architectural Overview']

export class ReadmeReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const header = [
      { id: 'repoName', title: 'Repo' },
      { id: 'hasReadme', title: 'Has Readme' },
      { id: 'hasTitle', title: 'Has Title' },
      { id: 'numSectionsMissing', title: '# of missing required sections' }
    ]
    const readmeReportOutput = new ReportOutputData(header, this._outputDir, 'ReadmeReport')

    for (const repo of repos) {
      try {
        let hasReadme = false
        let hasTitleTemp = false
        let numMissingSections: number = Math.max(appSections.length, libSections.length)

        for (const dep of repo.branches[repo.defaultBranch].deps) {
          if (validReadmeFile.Check(dep) && dep.fileType === 'README') {
            const readmeContent = dep.contents

            if (readmeContent.length > 0) {
              hasReadme = true
            } else {
              break
            }

            const { hasTitle, appHeadingCount, libHeadingCount } = this.hasTitleAndCountHeadings(readmeContent as ReadmeContentItem[])
            hasTitleTemp = hasTitle
            numMissingSections = appHeadingCount > libHeadingCount ? appSections.length - appHeadingCount : libSections.length - libHeadingCount
          }
        }

        readmeReportOutput.addRow({
          repoName: repo.name,
          hasReadme,
          hasTitle: hasTitleTemp,
          numSectionsMissing: numMissingSections
        })

        repo.healthScores[ReadmeReport.name] = this.grade(hasReadme ? (numMissingSections).toString() : '')
      } catch (error) {
        errorHandler(error, ReadmeReport.name, repo.name, repo.defaultBranch)
      }
    }

    this._reportOutputs.push(readmeReportOutput)
  }

  grade (input: string): HealthScore {
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
          weight: this._weight
        }
      }
    }
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }

  hasTitleAndCountHeadings (contents: ReadmeContentItem[]): { hasTitle: boolean, appHeadingCount: number, libHeadingCount: number } {
    let hasTitle = false
    let appHeadingCount = 0
    let libHeadingCount = 0
    let isCheckingHeading = false
    let currentHeadingContent = ''

    for (let i = 0; i < contents.length; i++) {
      const item = contents[i]

      if (item.type === 'heading_open' && (item.tag === 'h1' || item.tag === 'h2')) {
        isCheckingHeading = true
        currentHeadingContent = ''

        // check if there is inline content in the heading
        for (let j = i + 1; j < contents.length; j++) {
          const inlineItem = contents[j]
          if (inlineItem.type === 'inline' && (inlineItem.children != null)) {
            for (const child of inlineItem.children) {
              if (child.type === 'text' && child.content !== undefined) {
                currentHeadingContent += child.content
              }
            }
          } else if (inlineItem.type === 'text' && inlineItem.content !== undefined) {
            currentHeadingContent += inlineItem.content
          } else if (inlineItem.type === 'heading_close') {
            i = j
            break
          }
        }

        currentHeadingContent = currentHeadingContent.trim()
      }

      if (isCheckingHeading && currentHeadingContent !== '') {
        if (appSections.includes(currentHeadingContent)) {
          appHeadingCount++
        } else if (libSections.includes(currentHeadingContent)) {
          libHeadingCount++
        }

        isCheckingHeading = false
      }

      if (isCheckingHeading && (item.type === 'inline' || item.type === 'text')) {
        hasTitle = true
        isCheckingHeading = false
      }
    }

    return { hasTitle, appHeadingCount, libHeadingCount }
  }

  public get name (): string {
    return ReadmeReport.name
  }
}
