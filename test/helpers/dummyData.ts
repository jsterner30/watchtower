import { CacheFile } from '../../src/types'

export const fakeBranch = {
  name: 'feature/api-authentication',
  lastCommit: {
    author: 'Jesse Millar',
    date: '2015-05-11T17:37:37Z'
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
  staleBranch: false
}
export const fakeRepo = {
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
    date: '1971-01-01T00:00:00Z'
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
    critical: []
  },
  teams: [],
  admins: [],
  healthScores: {}
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
