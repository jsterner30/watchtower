import { CodeScanAlertCountReport } from './repoReports/alertCountReports/codeScanAlertCountReport'
import { CodeScanAlertReport } from './repoReports/alertScanReports/codeScanAlertReport'
import { DefaultBranchFileTypesReport } from './repoReports/simpleReports/defaultBranchFileTypesReport'
import { DependabotAlertReport } from './repoReports/alertScanReports/dependabotAlertReport'
import { DependabotAlertScanCountReport } from './repoReports/alertCountReports/dependabotAlertScanCountReport'
import { DependabotBranchReport } from './repoReports/countReports/dependabotBranchReport'
import { DevPrdBranchesReport } from './repoReports/simpleReports/devPrdBranchesReport'
import { DockerfileImageReport } from './repoReports/dependencyReports/dockerfileImageReport'
import { GHActionModuleReport } from './repoReports/dependencyReports/ghActionModuleReport'
import { LowFileBranchReport } from './repoReports/simpleReports/lowFileBranchReport'
import { LowFileRepoReport } from './repoReports/simpleReports/lowFileRepoReport'
import { NPMDependencyReport } from './repoReports/dependencyReports/npmDependencyReport'
import { NodeBranchVersionReport } from './repoReports/versionReports/branchVersionReports/nodeBranchVersionReport'
import { NodeRepoVersionReport } from './repoReports/versionReports/repoVersionReports/nodeRepoVersionReport'
import { OrgMemberReport } from './orgReports/OrgMemberReport'
import { OrgReport } from './orgReports/OrgReport'
import { OrgTeamReport } from './orgReports/OrgTeamReport'
import { OverallBranchReport } from './overallReports/overallBranchReport'
import { OverallHealthScoreReport } from './overallReports/overallHealthScoreReport'
import { OverallRepoReport } from './overallReports/overallRepoReport'
import { PrimaryLanguageReport } from './repoReports/simpleReports/primaryLanguageReport'
import { PublicAndInternalReport } from './repoReports/simpleReports/publicAndInternalReport'
import { ReadmeReport } from './repoReports/simpleReports/readmeReport'
import { RepoHasLanguageReport } from './repoReports/simpleReports/repoHasLanguageReport'
import { ReposWithoutNewCommitsReport } from './repoReports/simpleReports/reposWithoutNewCommitsReport'
import { SecretScanAlertCountReport } from './repoReports/alertCountReports/secretScanAlertCountReport'
import { SecretScanAlertReport } from './repoReports/alertScanReports/secretScanAlertReport'
import { StaleBranchReport } from './repoReports/countReports/staleBranchReport'
import { TeamlessRepoReport } from './repoReports/simpleReports/teamlessRepoReport'
import { TerraformBranchVersionReport } from './repoReports/versionReports/branchVersionReports/terraformBranchVersionReport'
import { TerraformModuleReport } from './repoReports/dependencyReports/terraformModuleReport'
import { TerraformRepoVersionReport } from './repoReports/versionReports/repoVersionReports/terraformRepoVersionReport'

export interface RepoReports {
  codeScanAlertCountReport: CodeScanAlertCountReport
  codeScanAlertReport: CodeScanAlertReport
  defaultBranchFileTypesReport: DefaultBranchFileTypesReport
  dependabotAlertReport: DependabotAlertReport
  dependabotAlertScanCountReport: DependabotAlertScanCountReport
  dependabotBranchReport: DependabotBranchReport
  devPrdBranchesReport: DevPrdBranchesReport
  dockerfileImageReport: DockerfileImageReport
  ghActionModuleReport: GHActionModuleReport
  lowFileBranchReport: LowFileBranchReport
  lowFileRepoReport: LowFileRepoReport
  npmDependencyReport: NPMDependencyReport
  nodeBranchVersionReport: NodeBranchVersionReport
  nodeRepoVersionReport: NodeRepoVersionReport
  primaryLanguageReport: PrimaryLanguageReport
  publicAndInternalReport: PublicAndInternalReport
  readmeReport: ReadmeReport
  repoHasLanguageReport: RepoHasLanguageReport
  reposWithoutNewCommitsReport: ReposWithoutNewCommitsReport
  secretScanAlertCountReport: SecretScanAlertCountReport
  secretScanAlertReport: SecretScanAlertReport
  staleBranchReport: StaleBranchReport
  teamlessRepoReport: TeamlessRepoReport
  terraformBranchVersionReport: TerraformBranchVersionReport
  terraformModuleReport: TerraformModuleReport
  terraformRepoVersionReport: TerraformRepoVersionReport
}

export function getRepoReports (): RepoReports {
  return {
    codeScanAlertCountReport: new CodeScanAlertCountReport(5, 'CodeScanAlertCountReports'),
    codeScanAlertReport: new CodeScanAlertReport(0, 'CodeScanAlertReports'),
    defaultBranchFileTypesReport: new DefaultBranchFileTypesReport(0, 'DefaultBranchFileTypesReport'),
    dependabotAlertReport: new DependabotAlertReport(0, 'DependabotAlertReport'),
    dependabotAlertScanCountReport: new DependabotAlertScanCountReport(5, 'DependabotAlertCountReport'),
    dependabotBranchReport: new DependabotBranchReport(4, 'DependabotBranchReport'),
    devPrdBranchesReport: new DevPrdBranchesReport(0, 'DevPrdBranchesReport'),
    dockerfileImageReport: new DockerfileImageReport(3, 'DockerfileImageReport'),
    ghActionModuleReport: new GHActionModuleReport(3, 'GHActionModuleReport'),
    lowFileBranchReport: new LowFileBranchReport(0, 'LowFileBranchReport'),
    lowFileRepoReport: new LowFileRepoReport(1, 'LowFileRepoReport'),
    npmDependencyReport: new NPMDependencyReport(3, 'NPMDependencyReport'),
    nodeBranchVersionReport: new NodeBranchVersionReport(0, 'NodeVersionReport'),
    nodeRepoVersionReport: new NodeRepoVersionReport(5, 'NodeVersionReport'),
    primaryLanguageReport: new PrimaryLanguageReport(0, 'PrimaryLanguageReport'),
    publicAndInternalReport: new PublicAndInternalReport(2, 'PublicAndInternalReport'),
    readmeReport: new ReadmeReport(3, 'ReadmeReport'),
    repoHasLanguageReport: new RepoHasLanguageReport(0, 'RepoHasLanguageReport'),
    reposWithoutNewCommitsReport: new ReposWithoutNewCommitsReport(3, 'ReposWithoutNewCommitsReport'),
    secretScanAlertCountReport: new SecretScanAlertCountReport(5, 'SecretScanAlertCountReport'),
    secretScanAlertReport: new SecretScanAlertReport(0, 'SecretScanAlertReport'),
    staleBranchReport: new StaleBranchReport(2, 'StaleBranchReport'),
    teamlessRepoReport: new TeamlessRepoReport(4, 'TeamlessRepoReport'),
    terraformBranchVersionReport: new TerraformBranchVersionReport(0, 'TerraformVersionReport'),
    terraformModuleReport: new TerraformModuleReport(3, 'TerraformModuleReport'),
    terraformRepoVersionReport: new TerraformRepoVersionReport(5, 'TerraformVersionReport')
  }
}

export interface OrgReports {
  orgReport: OrgReport
  orgMemberReport: OrgMemberReport
  orgTeamReport: OrgTeamReport
}

export function getOrgReports (): OrgReports {
  return {
    orgReport: new OrgReport(0, 'OrganizationReports'),
    orgMemberReport: new OrgMemberReport(0, 'OrganizationReports'),
    orgTeamReport: new OrgTeamReport(0, 'OrganizationReports')
  }
}

export interface OverallReports {
  overallBranchReport: OverallBranchReport
  overallRepoReport: OverallRepoReport
  overallHealthScoreReport: OverallHealthScoreReport
}

export function getOverallReports (): OverallReports {
  return {
    overallBranchReport: new OverallBranchReport(0, 'OverallReports'),
    overallRepoReport: new OverallRepoReport(0, 'OverallReports'),
    overallHealthScoreReport: new OverallHealthScoreReport(0, 'OverallReports')
  }
}
