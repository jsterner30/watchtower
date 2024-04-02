import { Type, Static, TSchema } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'

/**
 * Report Types
 */
export enum GradeEnum {
  A = 4.0,
  B = 3.0,
  C = 2.0,
  D = 1.0,
  F = 0.0,
  NotApplicable = '??'
}
const GradeSchema = Type.Enum(GradeEnum)
export type Grade = Static<typeof GradeSchema>

export const HeaderSchema = Type.Object({
  id: Type.String(),
  title: Type.String()
})
export type Header = Static<typeof HeaderSchema>

const HealthScoreSchema = Type.Object({
  weight: Type.Number({ minimum: 1, maximum: 5 }),
  grade: GradeSchema
})
export type HealthScore = Static<typeof HealthScoreSchema>

const ReportJSONOutputSchema = Type.Object({
  header: Type.Array(HeaderSchema),
  report: Type.Array(Type.Record(Type.String(), Type.Any()))
})
export type ReportJSONOutput = Static<typeof ReportJSONOutputSchema>

export enum ReportType {
  SIMPLE = 'simple',
  DEPENDENCY = 'dependency',
  VERSION = 'version',
  OVERALL = 'overall',
  ORGANIZATION = 'organization'
}

/**
 * FileType Schemas
 */
export enum FileTypeEnum {
  PACKAGE_JSON = 'PACKAGE_LOCK',
  PACKAGE_LOCK = 'PACKAGE_JSON',
  PIP_REQUIREMENTS = 'PIP_REQUIREMENTS',
  POM_XML = 'POM_XML',
  TERRAFORM = 'TERRAFORM',
  TFVARS = 'TFVARS',
  DOCKERFILE = 'DOCKERFILE',
  DOCKER_COMPOSE = 'DOCKER_COMPOSE',
  GITIGNORE = 'GITIGNORE',
  GITHUB_ACTION = 'GITHUB_ACTION', // this is the file found in the /.github/ dir that defines workflow runs
  GITHUB_ACTION_SOURCE = 'GITHUB_ACTION_SOURCE', // this is the file found in the source code for github actions that we have written in a file called actions.yml
  CODEOWNERS = 'CODEOWNERS',
  README = 'README',
  LICENSE = 'LICENSE',
  BABEL_CONFIG_JS = 'BABEL_CONFIG_JS',
  OPEN_API = 'OPEN_API'
}

const FileTypeSchema = Type.Enum(FileTypeEnum)
export type FileType = Static<typeof FileTypeSchema>

export const RuleFileSchema = Type.Object({
  fileName: Type.String(),
  fileType: FileTypeSchema
})
export type RuleFile = Static<typeof RuleFileSchema>

export const DockerComposeFileSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    services: Type.Record(Type.String(), Type.Any()),
    version: Type.String()
  })
])
export type DockerComposeFile = Static<typeof DockerComposeFileSchema>
export const validDockerComposeFile = TypeCompiler.Compile(DockerComposeFileSchema)

export const LicenseFileSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    contents: Type.Array(Type.String())
  })
])
export type LicenseFile = Static<typeof LicenseFileSchema>
export const validLicenseFile = TypeCompiler.Compile(LicenseFileSchema)

export const BabelConfigJsSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    contents: Type.Array(Type.String())
  })
])
export type BabelConfigJs = Static<typeof BabelConfigJsSchema>
export const validBabelConfigJs = TypeCompiler.Compile(BabelConfigJsSchema)

export const DockerfileSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    image: Type.String(),
    instructions: Type.Array(Type.String())
  })
])
export type Dockerfile = Static<typeof DockerfileSchema>
export const validDockerfile = TypeCompiler.Compile(DockerfileSchema)

export const GHAFileSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    contents: Type.Record(Type.String(), Type.Any()),
    dependabot: Type.Boolean()
  })
])
export type GHAFile = Static<typeof GHAFileSchema>
export const validGHAFile = TypeCompiler.Compile(GHAFileSchema)

export const GHASourceFileSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    contents: Type.Record(Type.String(), Type.Any())
  })
])
export type GHASourceFile = Static<typeof GHASourceFileSchema>
export const validGHASourceFile = TypeCompiler.Compile(GHASourceFileSchema)

export const GitignoreFileSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    ignored: Type.Array(Type.String())
  })
])
export type GitignoreFile = Static<typeof GitignoreFileSchema>
export const validGitignoreFile = TypeCompiler.Compile(GitignoreFileSchema)

export const OpenAPIFileSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    contents: Type.Record(Type.String(), Type.Any()) // after we figure out if this is useful, parse more fully.
  })
])
export type OpenAPIFile = Static<typeof OpenAPIFileSchema>
export const validOpenAPIFile = TypeCompiler.Compile(OpenAPIFileSchema)

const PIPDependencySchema = Type.Object({
  dependency: Type.String(),
  version: Type.String()
})
export type PIPDependency = Static<typeof PIPDependencySchema>

export const PIPRequirementsFileSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    dependencies: Type.Record(Type.String(), PIPDependencySchema)
  })
])
export type PIPRequirementsFile = Static<typeof PIPRequirementsFileSchema>
export const validPIPRequirementsFile = TypeCompiler.Compile(PIPRequirementsFileSchema)

const PomAsJsonSchema = Type.Object({
  groupId: Type.String(),
  artifactId: Type.String(),
  version: Type.String(),
  description: Type.Optional(Type.String()),
  dependencies: Type.Optional(Type.Array(Type.Object({
    groupId: Type.String(),
    artifactId: Type.String(),
    version: Type.String()
  }))),
  build: Type.Optional(Type.Object({
    plugins: Type.Optional(Type.Array(Type.Object({
      groupId: Type.String(),
      artifactId: Type.String(),
      version: Type.String(),
      configuration: Type.Optional(Type.Any())
    })))
  }))
})
export type PomAsJson = Static<typeof PomAsJsonSchema>

const PomXmlFileSchema = Type.Intersect([
  RuleFileSchema,
  PomAsJsonSchema
])
export type PomXmlFile = Static<typeof PomXmlFileSchema>

const PackageJsonFileSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    version: Type.String(),
    description: Type.Optional(Type.String()),
    main: Type.Optional(Type.String()),
    scripts: Type.Optional(Type.Record(Type.String(), Type.String())),
    dependencies: Type.Optional(Type.Record(Type.String(), Type.Any())),
    devDependencies: Type.Optional(Type.Record(Type.String(), Type.String())),
    peerDependencies: Type.Optional(Type.Record(Type.String(), Type.String()))
  })
])
export type PackageJsonFile = Static<typeof PackageJsonFileSchema>
export const validPackageJsonFile = TypeCompiler.Compile(PackageJsonFileSchema)

const PackageLockDependencySchema = Type.Object({
  version: Type.String(),
  resolved: Type.String(),
  integrity: Type.String(),
  dev: Type.Boolean(),
  optional: Type.Boolean(),
  dependencies: Type.Optional(Type.Record(Type.String(), Type.Any()))
})
export type PackageLockDependency = Static<typeof PackageLockDependencySchema>

const PackageLockFileSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    name: Type.String(),
    version: Type.String(),
    lockfileVersion: Type.Number(),
    dependencies: Type.Record(Type.String(), PackageLockDependencySchema)
  })
])
export type PackageLockFile = Static<typeof PackageLockFileSchema>
export const validPackageLockFile = TypeCompiler.Compile(PackageLockFileSchema)

export const ReadmeSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    contents: Type.Array(Type.Record(Type.String(), Type.Any()))
  })
])
export type ReadmeFile = Static<typeof ReadmeSchema>
export const validReadmeFile = TypeCompiler.Compile(ReadmeSchema)
export interface ReadmeContentItem {
  type: string
  tag: string
  content?: string
  children?: ReadmeContentItem[]
}

const TerraformFileSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    contents: Type.Record(Type.String(), Type.Any())
  })
])
export type TerraformFile = Static<typeof TerraformFileSchema>
export const validTerraformFile = TypeCompiler.Compile(TerraformFileSchema)

/**
 * Cache Types
 */
const SecretAlertLocationSchema = Type.Object({
  type: Type.String(),
  locationPath: Type.Union([Type.String(), Type.Null()]),
  locationUrl: Type.String()
})
export type SecretAlertLocation = Static<typeof SecretAlertLocationSchema>

const ScanAlertSchema = Type.Object({
  state: Type.String(),
  createdAt: Type.String(),
  repoName: Type.String()
})
export type ScanAlert = Static<typeof ScanAlertSchema>

const SecretScanAlertSchema = Type.Intersect([
  ScanAlertSchema,
  Type.Object({
    secretType: Type.String(),
    locations: Type.Array(SecretAlertLocationSchema)
  })
])
export type SecretScanAlert = Static<typeof SecretScanAlertSchema>

enum AlertLevels {
  low = 'low',
  medium = 'medium',
  high = 'high',
  critical = 'critical',
  none = 'none'
}

const DependabotAlertSchema = Type.Intersect([
  ScanAlertSchema,
  Type.Object({
    dependencyName: Type.String(),
    dependencyEcosystem: Type.String(),
    severity: Type.Enum(AlertLevels),
    summary: Type.String(),
    description: Type.String()
  })
])
export type DependabotAlert = Static<typeof DependabotAlertSchema>

const CodeScanAlertSchema = Type.Intersect([
  ScanAlertSchema,
  Type.Object({
    rule: Type.Object({
      id: Type.String(),
      severity: Type.String(),
      description: Type.String(),
      tags: Type.Array(Type.String()),
      securitySeverityLevel: Type.Enum(AlertLevels)
    }),
    tool: Type.Object({
      name: Type.String(),
      version: Type.String()
    }),
    mostRecentInstance: Type.Object({
      ref: Type.String(),
      environment: Type.String(),
      category: Type.String(),
      commitSha: Type.String(),
      message: Type.String(),
      locationPath: Type.String()
    }),
    location: Type.String()
  })
])
export type CodeScanAlert = Static<typeof CodeScanAlertSchema>

function GetScanAlertBySeverityLevel<T extends TSchema> (t: T): any {
  return Type.Object({
    low: Type.Array(t),
    medium: Type.Array(t),
    high: Type.Array(t),
    critical: Type.Array(t),
    none: Type.Array(t)
  })
}

const ScanAlertBySeverityLevelSchema = GetScanAlertBySeverityLevel(ScanAlertSchema)
export type ScanAlertBySeverityLevel = Static<typeof ScanAlertBySeverityLevelSchema>

/**
 * Github Types
 */
const CommitSchema = Type.Object({
  author: Type.String(),
  date: Type.String(),
  message: Type.String(),
  sha: Type.String()
})
export type Commit = Static<typeof CommitSchema>

const BranchProtectionSchema = Type.Object({
  requiredSignatures: Type.Boolean(),
  enforceAdmins: Type.Boolean(),
  requireLinearHistory: Type.Boolean(),
  allowForcePushes: Type.Boolean(),
  allowDeletions: Type.Boolean(),
  blockCreations: Type.Boolean(),
  requiredConversationResolution: Type.Boolean(),
  lockBranch: Type.Boolean(),
  allowForkSyncing: Type.Boolean()
})
export type BranchProtection = Static<typeof BranchProtectionSchema>

const GithubActionRunSchema = Type.Object({
  id: Type.Number(),
  status: Type.String(),
  conclusion: Type.String(),
  created_at: Type.String(),
  updated_at: Type.String(),
  branch: Type.String(),
  event: Type.String()
})
export type GithubActionRun = Static<typeof GithubActionRunSchema>

const BranchSchema = Type.Object({
  name: Type.String(),
  lastCommit: CommitSchema,
  dependabot: Type.Boolean(),
  ruleFiles: Type.Array(RuleFileSchema),
  fileCount: Type.Number(),
  fileTypes: Type.Record(Type.String(), Type.Number()),
  deployedBranch: Type.Boolean(),
  defaultBranch: Type.Boolean(),
  staleBranch: Type.Boolean(),
  branchProtections: Type.Object({
    protected: Type.Boolean(),
    protections: Type.Optional(BranchProtectionSchema)
  }),
  actionRuns: Type.Array(GithubActionRunSchema),
  reportResults: Type.Object({
    lowNodeVersion: Type.String(),
    highNodeVersion: Type.String(),
    lowTerraformVersion: Type.String(),
    highTerraformVersion: Type.String(),
    lowPythonVersion: Type.String(),
    highPythonVersion: Type.String()
  })
})
export type Branch = Static<typeof BranchSchema>

const PullRequestSchema = Type.Object({
  number: Type.Number(),
  title: Type.String(),
  state: Type.String(),
  user: Type.Object({
    login: Type.String()
  }),
  created_at: Type.String(),
  updated_at: Type.String(),
  dependabot: Type.Boolean()
})
export type PullRequest = Static<typeof PullRequestSchema>

const IssueSchema = Type.Object({
  number: Type.Number(),
  title: Type.String(),
  state: Type.String(),
  user: Type.Object({
    login: Type.String()
  }),
  created_at: Type.String(),
  updated_at: Type.String()
})
export type Issue = Static<typeof IssueSchema>

const RepoReportResultSchema = Type.Object({
  staleBranchCount: Type.Number(),
  dependabotBranchCount: Type.Number(),
  lowNodeVersion: Type.String(),
  highNodeVersion: Type.String(),
  lowTerraformVersion: Type.String(),
  highTerraformVersion: Type.String(),
  lowPythonVersion: Type.String(),
  highPythonVersion: Type.String(),
  followsDevPrdNamingScheme: Type.Boolean()
})
export type RepoReportResult = Static<typeof RepoReportResultSchema>

const RepoCustomPropertySchema = Type.Object({
  propertyName: Type.String(),
  value: Type.Array(Type.String()) // this is a type of array because the response can be a string or an array of string, so we code for the more general case
})
export type RepoCustomProperty = Static<typeof RepoCustomPropertySchema>

const RepoSchema = Type.Object({
  name: Type.String(),
  private: Type.Boolean(),
  url: Type.String(),
  description: Type.String(),
  language: Type.String(),
  allowForking: Type.Boolean(),
  visibility: Type.String(),
  forksCount: Type.Number(),
  archived: Type.Boolean(),
  defaultBranch: Type.String(),
  branches: Type.Record(Type.String(), BranchSchema),
  lastCommit: CommitSchema,
  openPullRequests: Type.Array(PullRequestSchema),
  openIssues: Type.Array(IssueSchema),
  licenseData: Type.Object({
    key: Type.String(),
    name: Type.String(),
    url: Type.String()
  }),
  codeScanAlerts: GetScanAlertBySeverityLevel(CodeScanAlertSchema),
  dependabotScanAlerts: GetScanAlertBySeverityLevel(DependabotAlertSchema),
  secretScanAlerts: GetScanAlertBySeverityLevel(SecretScanAlertSchema),
  teams: Type.Array(Type.String()),
  admins: Type.Array(Type.String()),
  healthScores: Type.Record(Type.String(), HealthScoreSchema),
  reportResults: RepoReportResultSchema,
  customProperties: Type.Record(Type.String(), RepoCustomPropertySchema),
  size: Type.Number(),
  empty: Type.Boolean()
})
export type Repo = Static<typeof RepoSchema>
export const validRepo = TypeCompiler.Compile(RepoSchema)

export const GithubMemberSchema = Type.Object({
  name: Type.String(),
  type: Type.String()
})
export type GithubMember = Static<typeof GithubMemberSchema>

export const GithubTeamSchema = Type.Object({
  name: Type.String(),
  slug: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  privacy: Type.String(),
  notificationSetting: Type.String(),
  permission: Type.String(),
  members: Type.Array(Type.String()),
  repos: Type.Array(Type.String())
})
export type GithubTeam = Static<typeof GithubTeamSchema>

const GithubOrganizationSchema = Type.Object({
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  email: Type.String({ format: 'email' }),
  members: Type.Array(Type.String()),
  teams: Type.Array(Type.String()),
  repoCount: Type.Integer(),
  publicRepoCount: Type.Integer(),
  createdDateTime: Type.String({ format: 'date-time' }),
  type: Type.String(),
  privateRepoCount: Type.Integer(),
  ownedPrivateRepoCount: Type.Integer(),
  diskUsage: Type.Integer(),
  billingEmail: Type.Union([Type.String(), Type.Null()]),
  defaultRepoPermission: Type.Union([Type.String(), Type.Null()]),
  membersCanCreateRepos: Type.Union([Type.Boolean(), Type.Null()]),
  twoFAEnabled: Type.Union([Type.Boolean(), Type.Null()]),
  membersAllowedRepositoryCreationType: Type.String(),
  membersCanCreatePublicRepositories: Type.Boolean(),
  membersCanCreatePrivateRepositories: Type.Boolean(),
  membersCanCreateInternalRepositories: Type.Boolean(),
  membersCanCreatePages: Type.Boolean(),
  membersCanForkPrivateRepositories: Type.Union([Type.Boolean(), Type.Null()]),
  webCommitSignoffRequired: Type.Boolean(),
  membersCanCreatePublicPages: Type.Boolean(),
  membersCanCreatePrivatePages: Type.Boolean(),
  planName: Type.String(),
  planSpace: Type.Integer(),
  planPrivateRepos: Type.Integer(),
  planFilledSeats: Type.Integer(),
  planSeats: Type.Integer(),
  advancedSecurityEnabledForNewRepositories: Type.Boolean(),
  dependabotAlertsEnabledForNewRepositories: Type.Boolean(),
  dependabotSecurityUpdatesEnabledForNewRepositories: Type.Boolean(),
  dependencyGraphEnabledForNewRepositories: Type.Boolean(),
  secretScanningEnabledForNewRepositories: Type.Boolean(),
  secretScanningPushProtectionEnabledForNewRepositories: Type.Boolean(),
  secretScanningPushProtectionCustomLinkEnabled: Type.Boolean(),
  secretScanningPushProtectionCustomLink: Type.Union([Type.String(), Type.Null()]),
  secretScanningValidityChecksEnabled: Type.Boolean()
})
export type GithubOrganization = Static<typeof GithubOrganizationSchema>

/**
 * Misc Types
 */
const VersionLocationSchema = Type.Object({
  filePath: Type.String(),
  branch: Type.String(),
  version: Type.String()
})
export type VersionLocation = Static<typeof VersionLocationSchema>

const ExtremeVersionsSchema = Type.Object({
  lowestVersion: Type.String(),
  lowestVersionPath: Type.String(),
  lowestVersionBranch: Type.String(),
  highestVersion: Type.String(),
  highestVersionPath: Type.String(),
  highestVersionBranch: Type.String()
})
export type ExtremeVersions = Static<typeof ExtremeVersionsSchema>

export interface OctokitOptions {
  org?: string
  per_page?: number
  q?: string
  team_slug?: string
  owner?: string
  ref?: string
  repo?: string
  branch?: string
  state?: string
  alert_number?: number
  permission?: string
  affiliation?: string
}

export interface Dependency {
  dependencyName: string
  dependencyEnvironment: string
  lastModifiedDate: string
  createdDate: string
  description: string
  maintainerCount: number
  latestVersion: string
  downloadCountLastWeek: number
}
