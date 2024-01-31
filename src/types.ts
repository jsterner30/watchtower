import { Type, Static } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'

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

export enum FileTypeEnum {
  PACKAGE_JSON = 'PACKAGE_LOCK',
  PACKAGE_LOCK = 'PACKAGE_JSON',
  TERRAFORM = 'TERRAFORM',
  TFVARS = 'TFVARS',
  DOCKERFILE = 'DOCKERFILE',
  DOCKER_COMPOSE = 'DOCKER_COMPOSE',
  GITIGNORE = 'GITIGNORE',
  GITHUB_ACTION = 'GITHUB_ACTION',
  CODEOWNERS = 'CODEOWNERS',
  README = 'README'
}
const FileTypeSchema = Type.Enum(FileTypeEnum)
export type FileType = Static<typeof FileTypeSchema>

const CommitSchema = Type.Object({
  author: Type.String(),
  date: Type.String()
})
export type Commit = Static<typeof CommitSchema>

export const RuleFileSchema = Type.Object({
  fileName: Type.String(),
  fileType: FileTypeSchema
})
export type RuleFile = Static<typeof RuleFileSchema>

const ExtremeVersionsSchema = Type.Object({
  lowestVersion: Type.String(),
  highestVersion: Type.String()
})
export type ExtremeVersions = Static<typeof ExtremeVersionsSchema>

export const HeaderSchema = Type.Array(
  Type.Object({
    id: Type.String(),
    title: Type.String()
  })
)
export type Header = Static<typeof HeaderSchema>

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

const BranchSchema = Type.Object({
  name: Type.String(),
  lastCommit: CommitSchema,
  dependabot: Type.Boolean(),
  deps: Type.Array(RuleFileSchema),
  fileCount: Type.Number(),
  fileTypes: Type.Record(Type.String(), Type.Number()),
  deployedBranch: Type.Boolean(),
  defaultBranch: Type.Boolean(),
  staleBranch: Type.Boolean(),
  branchProtections: Type.Object({
    protected: Type.Boolean(),
    protections: Type.Optional(BranchProtectionSchema)
  }),
  actionRuns: Type.Array(Type.Object({
    id: Type.Number(),
    status: Type.String(),
    conclusion: Type.String(),
    created_at: Type.String(),
    updated_at: Type.String()
  })),
  reportResults: Type.Object({
    lowNodeVersion: Type.String(),
    highNodeVersion: Type.String(),
    lowTerraformVersion: Type.String(),
    highTerraformVersion: Type.String()
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

const VersionLocationSchema = Type.Object({
  location: Type.String(), // this could be a branch or a file
  version: Type.String()
})
export type VersionLocation = Static<typeof VersionLocationSchema>

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

const HealthScoreSchema = Type.Object({
  weight: Type.Number({ minimum: 1, maximum: 5 }),
  grade: GradeSchema
})
export type HealthScore = Static<typeof HealthScoreSchema>

const SecretScanAlertSchema = Type.Object({
  secretType: Type.String(),
  secret: Type.String()
})
export type SecretScanAlert = Static<typeof SecretScanAlertSchema>

const SecretScanAlertBySeverityLevelSchema = Type.Object({
  critical: Type.Array(SecretScanAlertSchema)
})
export type SecretScanAlertBySeverityLevel = Static<typeof SecretScanAlertBySeverityLevelSchema>

const DependabotAlertSchema = Type.Object({
  dependencyName: Type.String(),
  dependencyEcosystem: Type.String(),
  severity: Type.String(),
  summary: Type.String(),
  description: Type.String()
})
export type DependabotAlert = Static<typeof DependabotAlertSchema>

const DependabotScanAlertBySeverityLevelSchema = Type.Object({
  low: Type.Array(DependabotAlertSchema),
  medium: Type.Array(DependabotAlertSchema),
  high: Type.Array(DependabotAlertSchema),
  critical: Type.Array(DependabotAlertSchema),
  none: Type.Array(DependabotAlertSchema)
})
export type DependabotScanAlertBySeverityLevel = Static<typeof DependabotScanAlertBySeverityLevelSchema>

const CodeScanAlertSchema = Type.Object({
  rule: Type.Object({
    id: Type.String(),
    severity: Type.String(),
    description: Type.String(),
    tags: Type.Array(Type.String()),
    securitySeverityLevel: Type.String()
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
  })
})
export type CodeScanAlert = Static<typeof CodeScanAlertSchema>

const CodeScanAlertBySeverityLevelSchema = Type.Object({
  low: Type.Array(CodeScanAlertSchema),
  medium: Type.Array(CodeScanAlertSchema),
  high: Type.Array(CodeScanAlertSchema),
  critical: Type.Array(CodeScanAlertSchema),
  none: Type.Array(CodeScanAlertSchema)
})
export type CodeScanAlertBySeverityLevel = Static<typeof CodeScanAlertBySeverityLevelSchema>

export const RepoInfoSchema = Type.Object({
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
  codeScanAlerts: CodeScanAlertBySeverityLevelSchema,
  dependabotScanAlerts: DependabotScanAlertBySeverityLevelSchema,
  secretScanAlerts: SecretScanAlertBySeverityLevelSchema,
  teams: Type.Array(Type.String()),
  admins: Type.Array(Type.String()),
  healthScores: Type.Record(Type.String(), HealthScoreSchema),
  reportResults: Type.Object({
    staleBranchCount: Type.Number(),
    dependabotBranchCount: Type.Number(),
    lowNodeVersion: Type.String(),
    highNodeVersion: Type.String(),
    lowTerraformVersion: Type.String(),
    highTerraformVersion: Type.String(),
    followsDevPrdNamingScheme: Type.Boolean()
  })
})
export type RepoInfo = Static<typeof RepoInfoSchema>
export const validRepoInfo = TypeCompiler.Compile(RepoInfoSchema)

export const CacheFileSchema = Type.Object({
  metadata: Type.Object({
    repoCount: Type.Number(),
    branchCount: Type.Number(),
    lastRunDate: Type.String()
  }),
  info: Type.Record(Type.String(), RepoInfoSchema)
})
export type CacheFile = Static<typeof CacheFileSchema>
export const validCacheFile = TypeCompiler.Compile(CacheFileSchema)

export const DockerComposeFileSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    services: Type.Record(Type.String(), Type.Any()),
    version: Type.String()
  })
])
export type DockerComposeFile = Static<typeof DockerComposeFileSchema>
export const validDockerComposeFile = TypeCompiler.Compile(DockerComposeFileSchema)

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

export const GitignoreFileSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    ignored: Type.Array(Type.String())
  })
])
export type GitignoreFile = Static<typeof GitignoreFileSchema>
export const validGitignoreFile = TypeCompiler.Compile(GitignoreFileSchema)

export const PackageJsonFileSchema = Type.Intersect([
  RuleFileSchema,
  Type.Object({
    version: Type.String(),
    description: Type.Optional(Type.String()),
    main: Type.Optional(Type.String()),
    scripts: Type.Optional(Type.Record(Type.String(), Type.String())),
    dependencies: Type.Optional(Type.Record(Type.String(), Type.Any())),
    devDependencies: Type.Optional(Type.Record(Type.String(), Type.String()))
  })
])
export type PackageJsonFile = Static<typeof PackageJsonFileSchema>
export const validPackageJsonFile = TypeCompiler.Compile(PackageJsonFileSchema)

export const PackageLockDependencySchema = Type.Object({
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

const ReportJSONOutputSchema = Type.Object({
  header: HeaderSchema,
  report: Type.Array(Type.Record(Type.String(), Type.Any()))
})
export type ReportJSONOutput = Static<typeof ReportJSONOutputSchema>
