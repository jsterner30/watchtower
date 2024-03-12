import {
  Grade, GradeEnum, HealthScore, validReadmeFile, ReadmeContentItem,
  type Repo
} from '../../../types'
import { Writers } from '../../report'
import { HeaderTitles, ReportWriter } from '../../../util'
import { RepoReport, RepoReportData } from '../repoReport'

const appSections = ['Overview', 'How to Run Locally', 'How to Deploy', 'How to Use This', 'Architectural Overview']
const libSections = ['Overview', 'How to Use This', 'How to Build Locally', 'How to Publish', 'Architectural Overview']

interface ReadmeReportData extends RepoReportData {
  repoName: string
  hasReadme: boolean
  hasTitle: boolean
  numSectionsMissing: number
}
interface ReadmeReportWriters extends Writers<ReadmeReportData> {
  readmeReportWrite: ReportWriter<ReadmeReportData>
}

export class ReadmeReport extends RepoReport<ReadmeReportData, ReadmeReportWriters> {
  protected async runReport (repo: Repo, writers: ReadmeReportWriters): Promise<void> {
    let hasReadme = false
    let hasTitleTemp = false
    let numMissingSections: number = Math.max(appSections.length, libSections.length)

    for (const ruleFile of repo.branches[repo.defaultBranch].ruleFiles) {
      if (validReadmeFile.Check(ruleFile) && ruleFile.fileType === 'README') {
        const readmeContent = ruleFile.contents

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

    writers.readmeReportWrite.addRow({
      repoName: repo.name,
      hasReadme,
      hasTitle: hasTitleTemp,
      numSectionsMissing: numMissingSections
    })

    repo.healthScores[ReadmeReport.name] = await this.grade(hasReadme ? (numMissingSections).toString() : '')
  }

  protected getHeaderTitles (): HeaderTitles<ReadmeReportData> {
    return {
      repoName: 'Repo',
      hasReadme: 'Has Readme',
      hasTitle: 'Has Title',
      numSectionsMissing: '# of missing required sections'
    }
  }

  protected getReportWriters (): ReadmeReportWriters {
    return {
      readmeReportWrite: new ReportWriter(this.getHeaderTitles(), this._outputDir, this.name)
    }
  }

  protected async grade (input: string): Promise<HealthScore> {
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
