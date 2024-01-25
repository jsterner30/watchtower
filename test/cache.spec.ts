import test from 'ava'
import {
  Writer,
  Cache,
  CacheInfo,
  S3Writer,
  lastRunDateFileName,
  filteredWithBranchesCacheFileName,
  allReposCacheFileName
} from '../src/util'
import { mock, when, reset, anyString, verify, instance } from 'ts-mockito'
import { fakeCacheFile, fakeRepo } from './helpers/dummyData'

let cache: Cache
const mockWriter: Writer = mock(S3Writer)
const fileUsage = 'cache'
const dataType = 'json'
const dirName = 'repos'
const filePath = 'test.json'

test.beforeEach(t => {
  reset(mockWriter)
  when(mockWriter.readFile(anyString(), anyString(), anyString())).thenResolve(JSON.stringify({}))
  when(mockWriter.readFile(fileUsage, dataType, lastRunDateFileName)).thenResolve(JSON.stringify({ lastRunDate: '2000-08-23T00:00:00Z' }))
  when(mockWriter.readFile(fileUsage, dataType, allReposCacheFileName)).thenResolve(JSON.stringify(fakeCacheFile))
  when(mockWriter.readFile(fileUsage, dataType, filteredWithBranchesCacheFileName)).thenResolve(JSON.stringify(fakeCacheFile))
  when(mockWriter.readAllFilesInDirectory(anyString(), anyString(), anyString())).thenResolve({})
  when(mockWriter.writeFile(anyString(), anyString(), anyString(), anyString())).thenResolve()
  when(mockWriter.readAllFilesInDirectory(anyString(), anyString(), anyString())).thenResolve({})
  cache = new Cache(instance(mockWriter), false)
})

/**
 * update() tests
 */
// USE_CACHE = false tests
const defaultCacheInfo: CacheInfo = {
  lastRunDate: '1970-01-01T00:00:00Z',
  allRepos: null,
  filteredWithBranches: null,
  repos: []
}

test.serial('update() should not attempt to read data/cache/json/allRepos.json and data/cache/json/filteredWithBranches.json if USE_CACHE set to false', async t => {
  await cache.update()
  verify(mockWriter.readFile(fileUsage, dataType, allReposCacheFileName)).times(0)
  verify(mockWriter.readFile(fileUsage, dataType, filteredWithBranchesCacheFileName)).times(0)
  t.deepEqual(cache.cache, defaultCacheInfo)
})

test.serial('update() should attempt to read data/cache/json/repos dir even if USE_CACHE set to false', async t => {
  await cache.update()
  verify(mockWriter.readAllFilesInDirectory(fileUsage, dataType, dirName)).times(1)
  t.deepEqual(cache.cache, defaultCacheInfo)
})

test.serial('update() should not attempt to read data/cache/json/lastRunDate.json if USE_CACHE set to false', async t => {
  await cache.update()
  verify(mockWriter.readFile(fileUsage, dataType, lastRunDateFileName)).times(0)
  t.deepEqual(cache.cache, defaultCacheInfo)
})

// USE_CACHE = true tests
const useCacheInfo: CacheInfo = {
  lastRunDate: '2000-08-23T00:00:00Z',
  allRepos: fakeCacheFile,
  filteredWithBranches: fakeCacheFile,
  repos: []
}
test.serial('update() should attempt to read data/cache/json/allRepos.json and data/cache/json/filteredWithBranches.json if USE_CACHE set to true', async t => {
  cache = new Cache(instance(mockWriter), true)
  await cache.update()
  verify(mockWriter.readFile(fileUsage, dataType, allReposCacheFileName)).times(1)
  verify(mockWriter.readFile(fileUsage, dataType, filteredWithBranchesCacheFileName)).times(1)
  t.deepEqual(cache.cache, useCacheInfo)
})

test.serial('update() should attempt to read data/cache/json/repos dir if USE_CACHE set to true', async t => {
  cache = new Cache(instance(mockWriter), true)
  await cache.update()
  verify(mockWriter.readAllFilesInDirectory(fileUsage, dataType, dirName)).times(1)
  t.deepEqual(cache.cache, useCacheInfo)
})

test.serial('update() should attempt to read data/cache/json/lastRunDate.json if USE_CACHE set to true', async t => {
  cache = new Cache(instance(mockWriter), true)
  await cache.update()
  verify(mockWriter.readFile(fileUsage, dataType, lastRunDateFileName)).times(1)
  t.deepEqual(cache.cache, useCacheInfo)
})

/**
 * getLastRunDate() tests
 */
test.serial('getLastRunDate() should get a lastRunDate of 1970 when writer returns null', async t => {
  when(mockWriter.readFile(fileUsage, dataType, lastRunDateFileName)).thenResolve(null)
  const date = await cache.getLastRunDate()
  verify(mockWriter.writeFile(anyString(), anyString(), anyString(), anyString())).times(1)
  t.deepEqual(date, '1970-01-01T00:00:00Z')
})

test.serial('getLastRunDate() should get a non-1970 lastRunDate when writer returns returns a date', async t => {
  const date = await cache.getLastRunDate()
  verify(mockWriter.writeFile(anyString(), anyString(), anyString(), anyString())).times(0)
  t.deepEqual(date, '2000-08-23T00:00:00Z')
})

/**
 * setLastRunDate() tests
 */
test.serial('setLastRunDate() should set a last run date of 4 hours before the date passed into the setLastRunDate function', async t => {
  const currentDate = new Date()
  await cache.setLastRunDate(currentDate)
  verify(mockWriter.writeFile(fileUsage, dataType, lastRunDateFileName, JSON.stringify({ lastRunDate: new Date(currentDate.setHours(currentDate.getHours() - 4)) })))
})

/**
 * getCacheFile tests
 */
test.serial('getCacheFile() should return null when writer.readFile() returns null', async t => {
  when(mockWriter.readFile(fileUsage, dataType, filePath)).thenResolve(null)
  const file = await cache.getCacheFile(filePath)
  verify(mockWriter.readFile(fileUsage, dataType, filePath)).times(1)
  t.deepEqual(file, null)
})

test.serial('getCacheFile() should return null when writer.readFile() returns invalid json', async t => {
  when(mockWriter.readFile(fileUsage, dataType, filePath)).thenResolve('{')
  const file = await cache.getCacheFile(filePath)
  verify(mockWriter.readFile(fileUsage, dataType, filePath)).times(1)
  t.deepEqual(file, null)
})

test.serial('getCacheFile() should return null when writer.readFile() returns valid json but an invalid Cachefile', async t => {
  when(mockWriter.readFile(fileUsage, dataType, filePath)).thenResolve('{}')
  const file = await cache.getCacheFile(filePath)
  verify(mockWriter.readFile(fileUsage, dataType, filePath)).times(1)
  t.deepEqual(file, null)
})

test.serial('getCacheFile() should return a Cachefile when writer.readFile() returns valid a json/Cachefile', async t => {
  when(mockWriter.readFile(fileUsage, dataType, filePath)).thenResolve(JSON.stringify(fakeCacheFile))
  const file = await cache.getCacheFile(filePath)
  verify(mockWriter.readFile(anyString(), anyString(), anyString())).times(1)
  t.deepEqual(file, fakeCacheFile)
})

/**
 * getRepoInfoCacheFiles() tests
 */
test.serial('getRepoInfoCacheFiles() should return an empty array if writer.readFile() returns null', async t => {
  when(mockWriter.readAllFilesInDirectory(fileUsage, dataType, dirName)).thenResolve(null)
  const files = await cache.getRepoInfoCacheFiles(dirName)
  verify(mockWriter.readAllFilesInDirectory(fileUsage, dataType, dirName)).times(1)
  t.deepEqual(files, [])
})

test.serial('getRepoInfoCacheFiles() should not add repoInfo to the return array if value is null', async t => {
  when(mockWriter.readAllFilesInDirectory(fileUsage, dataType, dirName)).thenResolve({ fakeRepo: null })
  const files = await cache.getRepoInfoCacheFiles(dirName)
  verify(mockWriter.readAllFilesInDirectory(fileUsage, dataType, dirName)).times(1)
  t.deepEqual(files, [])
})

test.serial('getRepoInfoCacheFiles() should not add repoInfo to the return array if value is invalid json', async t => {
  when(mockWriter.readAllFilesInDirectory(fileUsage, dataType, dirName)).thenResolve({ fakeRepo: '{' })
  const files = await cache.getRepoInfoCacheFiles(dirName)
  verify(mockWriter.readAllFilesInDirectory(fileUsage, dataType, dirName)).times(1)
  t.deepEqual(files, [])
})

test.serial('getRepoInfoCacheFiles() should not add repoInfo to return array if value is an invalid repoInfo', async t => {
  when(mockWriter.readAllFilesInDirectory(fileUsage, dataType, dirName)).thenResolve({ fakeRepo: '{}' })
  const files = await cache.getRepoInfoCacheFiles(dirName)
  verify(mockWriter.readAllFilesInDirectory(fileUsage, dataType, dirName)).times(1)
  t.deepEqual(files, [])
})

test.serial('getRepoInfoCacheFiles() should add repoInfo to return array if value is valid json/repoInfo', async t => {
  when(mockWriter.readAllFilesInDirectory(fileUsage, dataType, dirName)).thenResolve({ fakeRepo: JSON.stringify(fakeRepo) })
  const files = await cache.getRepoInfoCacheFiles(dirName)
  verify(mockWriter.readAllFilesInDirectory(fileUsage, dataType, dirName)).times(1)
  t.deepEqual(files, [fakeRepo])
})

/**
 * writeFileToCache() tests
 */
test.serial('writeFileToCache() should attempt to write file to data/cache/json/<fileName>', async t => {
  const fileName = filePath
  await cache.writeFileToCache(fileName, fakeRepo)
  verify(mockWriter.writeFile(fileUsage, dataType, fileName, JSON.stringify(fakeRepo)))
})
