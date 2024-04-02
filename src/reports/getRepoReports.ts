import { CodeScanAlertCountReport } from './repoReports/alertCountReports/codeScanAlertCountReport'
import { CodeScanAlertReport } from './repoReports/alertScanReports/codeScanAlertReport'
import { DefaultBranchFileTypesReport } from './repoReports/simpleReports/defaultBranchFileTypesReport'
import { DependabotAlertReport } from './repoReports/alertScanReports/dependabotAlertReport'
import { DependabotAlertScanCountReport } from './repoReports/alertCountReports/dependabotAlertScanCountReport'
import { DependabotBranchReport } from './repoReports/countReports/dependabotBranchReport'
import { DevPrdBranchesReport } from './repoReports/simpleReports/devPrdBranchesReport'
import { DockerfileImageReport } from './repoReports/dependencyReports/dockerfileImageReports/dockerfileImageReport'
import { DockerfileImageCondensedReport } from './repoReports/dependencyReports/dockerfileImageReports/dockerfileImageCondensedReport'
import { GHActionModuleReport } from './repoReports/dependencyReports/ghActionModuleReports/ghActionModuleReport'
import { GHActionModuleCondensedReport } from './repoReports/dependencyReports/ghActionModuleReports/ghActionModuleCondensedReport'
import { LowFileBranchReport } from './repoReports/simpleReports/lowFileBranchReport'
import { LowFileRepoReport } from './repoReports/simpleReports/lowFileRepoReport'
import { NPMDependencyReport } from './repoReports/dependencyReports/npmDependencyReports/npmDependencyReport'
import { NPMDependencyCondensedReport } from './repoReports/dependencyReports/npmDependencyReports/npmDependencyCondensedReport'
import { NodeBranchVersionReport } from './repoReports/versionReports/node/nodeBranchVersionReport'
import { NodeRepoVersionReport } from './repoReports/versionReports/node/nodeRepoVersionReport'
import { OpenAPIReport } from './repoReports/simpleReports/openAPIReport'
import { PrimaryLanguageReport } from './repoReports/simpleReports/primaryLanguageReport'
import { PublicAndInternalReport } from './repoReports/simpleReports/publicAndInternalReport'
import { ReadmeReport } from './repoReports/simpleReports/readmeReport'
import { RepoHasLanguageReport } from './repoReports/simpleReports/repoHasLanguageReport'
import { ReposWithoutNewCommitsReport } from './repoReports/simpleReports/reposWithoutNewCommitsReport'
import { SecretScanAlertCountReport } from './repoReports/alertCountReports/secretScanAlertCountReport'
import { SecretScanAlertReport } from './repoReports/alertScanReports/secretScanAlertReport'
import { StaleBranchReport } from './repoReports/countReports/staleBranchReport'
import { TeamlessRepoReport } from './repoReports/simpleReports/teamlessRepoReport'
import { TerraformBranchVersionReport } from './repoReports/versionReports/terraform/terraformBranchVersionReport'
import { TerraformModuleReport } from './repoReports/dependencyReports/terraformModuleReports/terraformModuleReport'
import { TerraformModuleCondensedReport } from './repoReports/dependencyReports/terraformModuleReports/terraformModuleCondensedReport'
import { TerraformRepoVersionReport } from './repoReports/versionReports/terraform/terraformRepoVersionReport'
import { PythonBranchVersionReport } from './repoReports/versionReports/python/pythonBranchVersionReport'
import { PythonRepoVersionReport } from './repoReports/versionReports/python/pythonRepoVersionReport'
import { PIPDependencyReport } from './repoReports/dependencyReports/pipDependencyReports/pipDependencyReport'
import { PIPDependencyCondensedReport } from './repoReports/dependencyReports/pipDependencyReports/pipDependencyCondensedReport'
import { LicenseReport } from './repoReports/simpleReports/LicenseReport'
import { ReportType } from '../types'

export interface RepoReports {
  codeScanAlertCountReport: CodeScanAlertCountReport
  codeScanAlertReport: CodeScanAlertReport
  defaultBranchFileTypesReport: DefaultBranchFileTypesReport
  dependabotAlertReport: DependabotAlertReport
  dependabotAlertScanCountReport: DependabotAlertScanCountReport
  dependabotBranchReport: DependabotBranchReport
  devPrdBranchesReport: DevPrdBranchesReport
  dockerfileImageReport: DockerfileImageReport
  dockerfileImageCondensedReport: DockerfileImageCondensedReport
  ghActionModuleReport: GHActionModuleReport
  ghActionModuleCondensedReport: GHActionModuleCondensedReport
  licenseReport: LicenseReport
  lowFileBranchReport: LowFileBranchReport
  lowFileRepoReport: LowFileRepoReport
  npmDependencyReport: NPMDependencyReport
  npmDependencyCondensedReport: NPMDependencyCondensedReport
  nodeBranchVersionReport: NodeBranchVersionReport
  nodeRepoVersionReport: NodeRepoVersionReport
  openAPIReport: OpenAPIReport
  pipDependencyReport: PIPDependencyReport
  pipDependencyCondensedReport: PIPDependencyCondensedReport
  primaryLanguageReport: PrimaryLanguageReport
  publicAndInternalReport: PublicAndInternalReport
  pythonBranchVersionReport: PythonBranchVersionReport
  pythonRepoVersionReport: PythonRepoVersionReport
  readmeReport: ReadmeReport
  repoHasLanguageReport: RepoHasLanguageReport
  reposWithoutNewCommitsReport: ReposWithoutNewCommitsReport
  secretScanAlertCountReport: SecretScanAlertCountReport
  secretScanAlertReport: SecretScanAlertReport
  staleBranchReport: StaleBranchReport
  teamlessRepoReport: TeamlessRepoReport
  terraformModuleReport: TerraformModuleReport
  terraformModuleCondensedReport: TerraformModuleCondensedReport
  terraformBranchVersionReport: TerraformBranchVersionReport
  terraformRepoVersionReport: TerraformRepoVersionReport
}

export function getRepoReports (): RepoReports {
  return {
    codeScanAlertCountReport: new CodeScanAlertCountReport(5, 'CodeScanAlertCountReports', 'The number of code scanning alerts at each level: critical, high, medium,and low for every repo.', '4', ReportType.SIMPLE),
    codeScanAlertReport: new CodeScanAlertReport(0, 'CodeScanAlertReports', 'Detailed information about code scanning alerts at each level: critical, high, medium,and low, for every repo.', '4', ReportType.SIMPLE),
    defaultBranchFileTypesReport: new DefaultBranchFileTypesReport(0, 'DefaultBranchFileTypesReport', 'The file type percentages of the files on the default branch of each repo.', '1', ReportType.SIMPLE),
    dependabotAlertReport: new DependabotAlertReport(0, 'DependabotAlertReport', 'The number of dependabot scanning alerts at each level: critical, high, medium,and low for every repo.', '4', ReportType.SIMPLE),
    dependabotAlertScanCountReport: new DependabotAlertScanCountReport(5, 'DependabotAlertCountReport', 'Detailed information on dependabot scanning alerts at each level: critical, high, medium,and low for every repo.', '4', ReportType.SIMPLE),
    dependabotBranchReport: new DependabotBranchReport(4, 'DependabotBranchReport', 'The number dependabot branches on every repo.', '1', ReportType.SIMPLE),
    devPrdBranchesReport: new DevPrdBranchesReport(0, 'DevPrdBranchesReport', 'Repos without the standard "dev" and "prd" branch naming scheme.', '1', ReportType.SIMPLE),
    dockerfileImageReport: new DockerfileImageReport(0, 'DockerfileImageReport', 'Instances of docker image usage across repos and branches.', '1', ReportType.SIMPLE),
    dockerfileImageCondensedReport: new DockerfileImageCondensedReport(0, 'DockerfileImageCondensedReport', 'The condensed version of the DockerfileImageReport dependency report', '1', ReportType.SIMPLE),
    ghActionModuleReport: new GHActionModuleReport(0, 'GHActionModuleReport', 'Instances of gha module usage across repos and branches.', '1', ReportType.SIMPLE),
    ghActionModuleCondensedReport: new GHActionModuleCondensedReport(0, 'GHActionModuleCondensedReport', 'The condensed version of the GHActionModule dependency report.', '1', ReportType.SIMPLE),
    licenseReport: new LicenseReport(0, 'LicenseReport', 'What licenses do repos with licenses use', '1', ReportType.SIMPLE),
    lowFileBranchReport: new LowFileBranchReport(0, 'LowFileBranchReport', 'The the branches with a low (<=5) file count.', '1', ReportType.SIMPLE),
    lowFileRepoReport: new LowFileRepoReport(1, 'LowFileRepoReport', 'The the repos with a low (<=5) file count on every branch.', '1', ReportType.SIMPLE),
    npmDependencyReport: new NPMDependencyReport(0, 'NPMDependencyReport', 'Instances of npm dependency usage across repos and branches.', '1', ReportType.SIMPLE),
    npmDependencyCondensedReport: new NPMDependencyCondensedReport(0, 'NPMDependencyCondensedReport', 'The condensed version of the NPMDependency dependency report', '1', ReportType.SIMPLE),
    nodeBranchVersionReport: new NodeBranchVersionReport(0, 'NodeVersionReport', 'Lowest and highest node versions on each branch in the org and the default branches of every repo in the org.', '2', ReportType.VERSION),
    openAPIReport: new OpenAPIReport(0, 'OpenAPIReport', 'What repos have an OpenAPI file on their default branch', '1', ReportType.SIMPLE),
    pipDependencyReport: new PIPDependencyReport(0, 'PIPDependencyReport', 'Instances of pip dependency usage across repos and branches.', '1', ReportType.SIMPLE),
    pipDependencyCondensedReport: new PIPDependencyCondensedReport(0, 'PIPDependencyCondensedReport', 'The condensed version of the PIPDependency report.', '1', ReportType.SIMPLE),
    nodeRepoVersionReport: new NodeRepoVersionReport(5, 'NodeVersionReport', 'Lowest and highest node versions on every repo in the org, considering every branch in the org.', '1', ReportType.VERSION),
    primaryLanguageReport: new PrimaryLanguageReport(0, 'PrimaryLanguageReport', 'The primary language for every repo in the org.', '1', ReportType.SIMPLE),
    publicAndInternalReport: new PublicAndInternalReport(2, 'PublicAndInternalReport', 'Repos that are marked as public or internal.', '1', ReportType.SIMPLE),
    pythonBranchVersionReport: new PythonBranchVersionReport(0, 'PythonVersionReport', 'Lowest and highest python versions on each branch in the org and the default branches of every repo in the org.', '2', ReportType.VERSION),
    pythonRepoVersionReport: new PythonRepoVersionReport(5, 'PythonVersionReport', 'Lowest and highest python versions on every repo in the org, considering every branch in the org.', '1', ReportType.VERSION),
    readmeReport: new ReadmeReport(3, 'ReadmeReport', 'Whether repos have a readme, whether it includes a title, and how many required sections they are missing.', '1', ReportType.SIMPLE),
    repoHasLanguageReport: new RepoHasLanguageReport(0, 'RepoHasLanguageReport', 'Which repos contain a language, and the percentage of file extensions on each the default branch of each repo.', '2', ReportType.SIMPLE),
    reposWithoutNewCommitsReport: new ReposWithoutNewCommitsReport(3, 'ReposWithoutNewCommitsReport', 'Repos without a new commit in the last two years.', '1', ReportType.SIMPLE),
    secretScanAlertCountReport: new SecretScanAlertCountReport(5, 'SecretScanAlertCountReport', 'The number of secret scanning alerts for each repo.', '1', ReportType.SIMPLE),
    secretScanAlertReport: new SecretScanAlertReport(0, 'SecretScanAlertReport', 'Detailed information on every secret scanning alert for every repo in the org.', '1', ReportType.SIMPLE),
    staleBranchReport: new StaleBranchReport(2, 'StaleBranchReport', 'The number of stale branches on every repo in the org.', '1', ReportType.SIMPLE),
    teamlessRepoReport: new TeamlessRepoReport(4, 'TeamlessRepoReport', 'The repos in the org that do not have an admin team in Github, along with the user admins of the repo.', '1', ReportType.SIMPLE),
    terraformModuleReport: new TerraformModuleReport(0, 'TerraformModuleReport', 'Instances of terraform module usage across repos and branches.', '1', ReportType.SIMPLE),
    terraformModuleCondensedReport: new TerraformModuleCondensedReport(0, 'TerraformModuleCondensedReport', 'The condensed version of the TerraformModuleReport.', '1', ReportType.SIMPLE),
    terraformBranchVersionReport: new TerraformBranchVersionReport(0, 'TerraformVersionReport', 'Lowest and highest terraform versions on each branch in the org and the default branches of every repo in the org.', '2', ReportType.VERSION),
    terraformRepoVersionReport: new TerraformRepoVersionReport(5, 'TerraformVersionReport', 'Lowest and highest terraform versions on every repo in the org considering every branch in the org.', '1', ReportType.VERSION)
  }
}
