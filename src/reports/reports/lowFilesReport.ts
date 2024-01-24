import {
  GradeEnum, HealthScore,
  type RepoInfo
} from '../../types'
import { errorHandler, ReportOutputData } from '../../util'
import { Report } from '../report'

export class LowFilesReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const lowFileRepoOutput = new ReportOutputData([{ id: 'repoName', title: 'Repo' }, { id: 'fileCount', title: 'FileCount' }],
      this._outputDir, 'LowFileCountInRepoReport')

    const lowFileBranchOutput = new ReportOutputData([{ id: 'repoName', title: 'Repo' }, { id: 'branchName', title: 'Branch' }, { id: 'fileCount', title: 'FileCount' }],
      this._outputDir, 'LowFileCountOnBranchReport')

    for (const repo of repos) {
      let someBranchHasFiles = false
      for (const branchName in repo.branches) {
        try {
          if (repo.branches[branchName].fileCount < 5 && !repo.branches[branchName].dependabot) {
            lowFileBranchOutput.addRow({
              repoName: repo.name,
              branchName,
              fileCount: repo.branches[branchName].fileCount
            })
          } else {
            someBranchHasFiles = true
          }
        } catch (error) {
          errorHandler(error, LowFilesReport.name, repo.name, branchName)
        }
      }
      if (!someBranchHasFiles && Object.keys(repo.branches).length !== 0) {
        lowFileRepoOutput.addRow({
          repoName: repo.name,
          fileCount: repo.branches[repo.defaultBranch].fileCount
        })
      }

      repo.healthScores[LowFilesReport.name] = this.grade({ someBranchHasFiles, numberBranches: Object.keys(repo.branches).length })
    }

    this._reportOutputs.push(lowFileRepoOutput)
    this._reportOutputs.push(lowFileBranchOutput)
  }

  grade (input: { someBranchHasFiles: boolean, numberBranches: number }): HealthScore {
    if (!input.someBranchHasFiles && input.numberBranches !== 0) {
      return {
        grade: GradeEnum.F,
        weight: this._weight
      }
    }

    return {
      grade: GradeEnum.A,
      weight: this._weight
    }
  }

  public get name (): string {
    return LowFilesReport.name
  }
}
