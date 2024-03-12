import {
  DockerComposeRule,
  DockerfileRule,
  DotGithubDirRule,
  FileCountRule,
  FileTypesRules,
  GitignoreRule,
  GithubActionSourceFileRule,
  LicenseFileRule,
  PackageJsonRule,
  PackageLockRule,
  PIPRequirementsRule,
  PomXmlRule,
  ReadmeRule,
  TerraformRule
} from './branchRules'
import { DeployedBranchRule, StaleBranchRule } from './secondaryBranchRules'
import { AdminsRule, GithubActionRunRule, LatestCommitRule, OpenIssueRule, OpenPRRule, TeamsRule } from './repoRules'
import { CodeScanAlertsRule, DependabotAlertsRule, SecretScanAlertsRule } from './orgRules'

export interface BranchRules {
  dockerComposeRule: DockerComposeRule
  dockerfileRule: DockerfileRule
  dotGithubDirRule: DotGithubDirRule
  fileCountRule: FileCountRule
  fileTypesRules: FileTypesRules
  githubActionFileRule: GithubActionSourceFileRule
  gitignoreRule: GitignoreRule
  licenseRule: LicenseFileRule
  packageJsonRule: PackageJsonRule
  packageLockRule: PackageLockRule
  pipRequirementsRule: PIPRequirementsRule
  pomXmlRule: PomXmlRule
  readmeRule: ReadmeRule
  terraformRule: TerraformRule
}

export function getBranchRules (): BranchRules {
  return {
    dockerComposeRule: new DockerComposeRule(),
    dockerfileRule: new DockerfileRule(),
    dotGithubDirRule: new DotGithubDirRule(),
    fileCountRule: new FileCountRule(),
    fileTypesRules: new FileTypesRules(),
    githubActionFileRule: new GithubActionSourceFileRule(),
    gitignoreRule: new GitignoreRule(),
    licenseRule: new LicenseFileRule(),
    packageJsonRule: new PackageJsonRule(),
    packageLockRule: new PackageLockRule(),
    pipRequirementsRule: new PIPRequirementsRule(),
    pomXmlRule: new PomXmlRule(),
    readmeRule: new ReadmeRule(),
    terraformRule: new TerraformRule()
  }
}

export interface SecondaryBranchRules {
  deployedBranchRule: DeployedBranchRule
  staleBranchRule: StaleBranchRule
}

export function getSecondaryBranchRules (): SecondaryBranchRules {
  return {
    deployedBranchRule: new DeployedBranchRule(),
    staleBranchRule: new StaleBranchRule()
  }
}

export interface RepoRules {
  latestCommitRule: LatestCommitRule
  adminsRule: AdminsRule
  teamsRule: TeamsRule
  openPRRule: OpenPRRule
  openIssueRule: OpenIssueRule
  githubActionRunRule: GithubActionRunRule
}

export function getRepoRules (): RepoRules {
  return {
    latestCommitRule: new LatestCommitRule(),
    adminsRule: new AdminsRule(),
    teamsRule: new TeamsRule(),
    openPRRule: new OpenPRRule(),
    openIssueRule: new OpenIssueRule(),
    githubActionRunRule: new GithubActionRunRule()
  }
}

export interface OrgRules {
  codeScanAlertsRule: CodeScanAlertsRule
  dependabotAlertsRule: DependabotAlertsRule
  secretScanAlertsRule: SecretScanAlertsRule
}

export function getOrgRules (): OrgRules {
  return {
    codeScanAlertsRule: new CodeScanAlertsRule(),
    dependabotAlertsRule: new DependabotAlertsRule(),
    secretScanAlertsRule: new SecretScanAlertsRule()
  }
}
