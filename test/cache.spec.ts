import test from 'ava'
import { Writer, Cache, CacheInfo, S3Writer } from '../src/util'
import { mock, when, reset, anyString, verify, instance } from 'ts-mockito'
import { CacheFile } from '../src/types'

let cache: Cache
const mockWriter: Writer = mock(S3Writer)

const fakeAllReposFile: CacheFile = {
  metadata: {
    repoCount: 1,
    branchCount: 0,
    lastRunDate: '2000-08-23T00:00:00Z'
  },
  info: {
    fakeRepo: {
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
      branches: {},
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
  }
}
const fakeFilteredWithBranchesFile: CacheFile = {
  metadata: {
    repoCount: 1,
    branchCount: 0,
    lastRunDate: '2000-08-23T00:00:00Z'
  },
  info: {
    fakeRepo: {
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
        fakeBranch: {
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
  }
}

test.beforeEach(t => {
  reset(mockWriter)
  when(mockWriter.readFile(anyString(), anyString(), anyString())).thenResolve(JSON.stringify({}))
  when(mockWriter.readFile('cache', 'json', 'lastRunDate.json')).thenResolve(JSON.stringify({ lastRunDate: '2000-08-23T00:00:00Z' }))
  when(mockWriter.readFile('cache', 'json', 'filteredWithBranches.json')).thenResolve(JSON.stringify(fakeFilteredWithBranchesFile))
  when(mockWriter.readFile('cache', 'json', 'allRepos.json')).thenResolve(JSON.stringify(fakeAllReposFile))
  when(mockWriter.readAllFilesInDirectory(anyString(), anyString(), anyString())).thenResolve({})
  cache = new Cache(instance(mockWriter), false)
})

/**
 * USE_CACHE TESTS
 */
// USE_CACHE = false tests
const defaultCacheInfo: CacheInfo = {
  lastRunDate: '1970-01-01T00:00:00Z',
  allRepos: null,
  filteredWithBranches: null,
  repos: []
}

test.serial('should not attempt to read data/cache/json/allRepos.json and data/cache/json/filteredWithBranches.json if USE_CACHE set to false', async t => {
  await cache.update()
  verify(mockWriter.readFile('data', 'cache', 'allRepos.json')).times(0)
  verify(mockWriter.readFile('data', 'cache', 'filteredWithBranches.json')).times(0)
  t.deepEqual(cache.cache, defaultCacheInfo)
})
test.serial('should attempt to read data/cache/json/repos dir even if USE_CACHE set to false', async t => {
  await cache.update()
  verify(mockWriter.readAllFilesInDirectory('cache', 'json', 'repos')).times(1)
  t.deepEqual(cache.cache, defaultCacheInfo)
})
test.serial('should not attempt to read data/cache/json/lastRunDate.json if USE_CACHE set to false', async t => {
  await cache.update()
  verify(mockWriter.readFile('cache', 'json', 'lastRunDate.json')).times(0)
  t.deepEqual(cache.cache, defaultCacheInfo)
})

// USE_CACHE = true tests
const useCacheInfo: CacheInfo = {
  lastRunDate: '2000-08-23T00:00:00Z',
  allRepos: fakeAllReposFile,
  filteredWithBranches: fakeFilteredWithBranchesFile,
  repos: []
}
test.serial('should attempt to read data/cache/json/allRepos.json and data/cache/json/filteredWithBranches.json if USE_CACHE set to true', async t => {
  cache = new Cache(instance(mockWriter), true)
  await cache.update()
  verify(mockWriter.readFile('cache', 'json', 'allRepos.json')).times(1)
  verify(mockWriter.readFile('cache', 'json', 'filteredWithBranches.json')).times(1)
  t.deepEqual(cache.cache, useCacheInfo)
})
test.serial('should attempt to read data/cache/json/repos dir if USE_CACHE set to true', async t => {
  cache = new Cache(instance(mockWriter), true)
  await cache.update()
  verify(mockWriter.readAllFilesInDirectory('cache', 'json', 'repos')).times(1)
  t.deepEqual(cache.cache, useCacheInfo)
})
test.serial('should attempt to read data/cache/json/lastRunDate.json if USE_CACHE set to true', async t => {
  cache = new Cache(instance(mockWriter), true)
  await cache.update()
  verify(mockWriter.readFile('cache', 'json', 'lastRunDate.json')).times(1)
  t.deepEqual(cache.cache, useCacheInfo)
})
