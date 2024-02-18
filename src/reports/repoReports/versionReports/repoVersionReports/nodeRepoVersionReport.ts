import type {
  Repo,
  VersionLocation,
  ExtremeVersions, Grade
} from '../../../../types'
import { RepoVersionReport } from './repoVersionReport'
import { fetchNodeLTSVersion, gatherNodeFiles } from '../../../../util'
import { GradeEnum } from '../../../../types'

export class NodeRepoVersionReport extends RepoVersionReport {
  protected gatherSoftwareFiles (repo: Repo, branchName: string): VersionLocation[] {
    return gatherNodeFiles(repo, branchName)
  }

  public get name (): string {
    return NodeRepoVersionReport.name
  }

  protected async getGradeMinValues (): Promise<Record<string, Grade>> {
    const lts = await fetchNodeLTSVersion()
    return {
      [lts + '.0.0']: GradeEnum.A,
      [(parseInt(lts) - 2).toString() + '.0.0']: GradeEnum.B,
      [(parseInt(lts) - 4).toString() + '.0.0']: GradeEnum.C,
      [(parseInt(lts) - 6).toString() + '.0.0']: GradeEnum.D,
      '0.0.0': GradeEnum.F
    }
  }

  protected modifyReportRepoResults (allBranchRepoExtrema: ExtremeVersions, repo: Repo): void {
    repo.reportResults.lowNodeVersion = allBranchRepoExtrema.lowestVersion
    repo.reportResults.highNodeVersion = allBranchRepoExtrema.highestVersion
  }
}
