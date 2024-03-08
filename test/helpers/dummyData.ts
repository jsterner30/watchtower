import { Branch, CacheFile, Repo } from '../../src/types'
import { defaultCommit } from '../../src/util'

export const fakeBranch: Branch = {
  name: 'feature/api-authentication',
  lastCommit: defaultCommit,
  dependabot: false,
  deps: [],
  fileCount: 0,
  fileTypes: {},
  branchProtections: {
    protected: false
  },
  actionRuns: [],
  deployedBranch: false,
  defaultBranch: false,
  staleBranch: false,
  reportResults: {
    lowNodeVersion: '??',
    highNodeVersion: '??',
    lowTerraformVersion: '??',
    highTerraformVersion: '??',
    lowPythonVersion: '??',
    highPythonVersion: '??'
  }
}
export const fakeRepo: Repo = {
  name: 'fakeRepo',
  private: true,
  url: 'https://api.github.com/repos/org/fakeRepo',
  description: 'A fakeRepo',
  language: 'Typescript',
  allowForking: true,
  visibility: 'private',
  forksCount: 0,
  archived: true,
  defaultBranch: 'main',
  licenseData: {
    key: 'mit',
    name: 'MIT License',
    url: 'none'
  },
  branches: {
    fakeBranch
  },
  lastCommit: defaultCommit,
  openPullRequests: [],
  openIssues: [],
  codeScanAlerts: {
    low: [],
    medium: [],
    high: [],
    critical: [],
    none: []
  },
  dependabotScanAlerts: {
    low: [],
    medium: [],
    high: [],
    critical: [],
    none: []
  },
  secretScanAlerts: {
    low: [],
    medium: [],
    high: [],
    critical: [],
    none: []
  },
  teams: [],
  admins: [],
  healthScores: {},
  reportResults: {
    staleBranchCount: -1,
    dependabotBranchCount: -1,
    lowNodeVersion: '??',
    highNodeVersion: '??',
    lowTerraformVersion: '??',
    highTerraformVersion: '??',
    lowPythonVersion: '??',
    highPythonVersion: '??',
    followsDevPrdNamingScheme: false
  },
  customProperties: {}
}
export const fakeCacheFile: CacheFile = {
  metadata: {
    repoCount: 1,
    branchCount: 0,
    lastRunDate: '2000-08-23T00:00:00Z'
  },
  info: {
    fakeRepo
  }
}
