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
import { PythonBranchVersionReport } from './repoReports/versionReports/branchVersionReports/pythonBranchVersionReport'
import { PythonRepoVersionReport } from './repoReports/versionReports/repoVersionReports/repoPythonVersionReport'
import { PIPDependencyReport } from './repoReports/dependencyReports/pipDependencyReport'

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
  pipDependencyReport: PIPDependencyReport
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
  terraformBranchVersionReport: TerraformBranchVersionReport
  terraformRepoVersionReport: TerraformRepoVersionReport
}

export function getRepoReports (): RepoReports {
  return {
    codeScanAlertCountReport: new CodeScanAlertCountReport(5, 'CodeScanAlertCountReports', 'The number of code scanning alerts at each level: critical, high, medium,and low for every repo.', '4', 'simple'),
    codeScanAlertReport: new CodeScanAlertReport(0, 'CodeScanAlertReports', 'Detailed information about code scanning alerts at each level: critical, high, medium,and low, for every repo.', '4', 'simple'),
    defaultBranchFileTypesReport: new DefaultBranchFileTypesReport(0, 'DefaultBranchFileTypesReport', 'The file type percentages of the files on the default branch of each repo.', '1', 'simple'),
    dependabotAlertReport: new DependabotAlertReport(0, 'DependabotAlertReport', 'The number of dependabot scanning alerts at each level: critical, high, medium,and low for every repo.', '4', 'simple'),
    dependabotAlertScanCountReport: new DependabotAlertScanCountReport(5, 'DependabotAlertCountReport', 'Detailed information on dependabot scanning alerts at each level: critical, high, medium,and low for every repo.', '4', 'simple'),
    dependabotBranchReport: new DependabotBranchReport(4, 'DependabotBranchReport', 'The number dependabot branches on every repo.', '1', 'simple'),
    devPrdBranchesReport: new DevPrdBranchesReport(0, 'DevPrdBranchesReport', 'Repos without the standard "dev" and "prd" branch naming scheme.', '1', 'simple'),
    dockerfileImageReport: new DockerfileImageReport(3, 'DockerfileImageReport', 'Which repos use a given image.', '1 per image in the org', 'dependency'),
    ghActionModuleReport: new GHActionModuleReport(3, 'GHActionModuleReport', 'Which repos use a given GHA module.', '1 per GHA module in org', 'dependency'),
    lowFileBranchReport: new LowFileBranchReport(0, 'LowFileBranchReport', 'The the branches with a low (<=5) file count.', '1', 'simple'),
    lowFileRepoReport: new LowFileRepoReport(1, 'LowFileRepoReport', 'The the repos with a low (<=5) file count on every branch.', '1', 'simple'),
    npmDependencyReport: new NPMDependencyReport(3, 'NPMDependencyReport', 'Which repos use a given npm dependency.', '1 per npm dependency in the org', 'dependency'),
    nodeBranchVersionReport: new NodeBranchVersionReport(0, 'NodeVersionReport', 'Lowest and highest node versions on each branch in the org and the default branches of every repo in the org.', '2', 'version'),
    pipDependencyReport: new PIPDependencyReport(3, 'PIPDependencyReport', 'Which repos use a given pip dependency.', '1 per pip dependency in the org', 'dependency'),
    nodeRepoVersionReport: new NodeRepoVersionReport(5, 'NodeVersionReport', 'Lowest and highest node versions on every repo in the org, considering every branch in the org.', '1', 'version'),
    primaryLanguageReport: new PrimaryLanguageReport(0, 'PrimaryLanguageReport', 'The primary language for every repo in the org.', '1', 'simple'),
    publicAndInternalReport: new PublicAndInternalReport(2, 'PublicAndInternalReport', 'Repos that are marked as public or internal.', '1', 'simple'),
    pythonBranchVersionReport: new PythonBranchVersionReport(0, 'PythonVersionReport', 'Lowest and highest python versions on each branch in the org and the default branches of every repo in the org.', '2', 'version'),
    pythonRepoVersionReport: new PythonRepoVersionReport(5, 'PythonVersionReport', 'Lowest and highest python versions on every repo in the org, considering every branch in the org.', '1', 'version'),
    readmeReport: new ReadmeReport(3, 'ReadmeReport', 'Whether repos have a readme, whether it includes a title, and how many required sections they are missing.', '1', 'simple'),
    repoHasLanguageReport: new RepoHasLanguageReport(0, 'RepoHasLanguageReport', 'Which repos contain a language, and the percentage of file extensions on each the default branch of each repo.', '2', 'simple'),
    reposWithoutNewCommitsReport: new ReposWithoutNewCommitsReport(3, 'ReposWithoutNewCommitsReport', 'Repos without a new commit in the last two years.', '1', 'simple'),
    secretScanAlertCountReport: new SecretScanAlertCountReport(5, 'SecretScanAlertCountReport', 'The number of secret scanning alerts for each repo.', '1', 'simple'),
    secretScanAlertReport: new SecretScanAlertReport(0, 'SecretScanAlertReport', 'Detailed information on every secret scanning alert for every repo in the org.', '1', 'simple'),
    staleBranchReport: new StaleBranchReport(2, 'StaleBranchReport', 'The number of stale branches on every repo in the org.', '1', 'simple'),
    teamlessRepoReport: new TeamlessRepoReport(4, 'TeamlessRepoReport', 'The repos in the org that do not have an admin team in Github, along with the user admins of the repo.', '1', 'simple'),
    terraformModuleReport: new TerraformModuleReport(3, 'TerraformModuleReport', 'Which repos use a given terraform module.', '1 per terraform module in the org', 'dependency'),
    terraformBranchVersionReport: new TerraformBranchVersionReport(0, 'TerraformVersionReport', 'Lowest and highest terraform versions on each branch in the org and the default branches of every repo in the org.', '2', 'version'),
    terraformRepoVersionReport: new TerraformRepoVersionReport(5, 'TerraformVersionReport', 'Lowest and highest terraform versions on every repo in the org considering every branch in the org.', '1', 'version')
  }
}
