import { Branch, CacheFile, Repo } from '../../src/types'

export const fakeBranch: Branch = {
  name: 'feature/api-authentication',
  lastCommit: {
    author: 'Jesse Millar',
    date: '2015-05-11T17:37:37Z',
    message: ''
  },
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
    highTerraformVersion: '??'
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
  branches: {
    fakeBranch
  },
  lastCommit: {
    author: '',
    date: '1971-01-01T00:00:00Z',
    message: ''
  },
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
    followsDevPrdNamingScheme: false
  }
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
