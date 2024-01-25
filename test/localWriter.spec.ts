import test from 'ava'
import { LocalWriter, FileSystemWrapper } from '../src/util'
import { instance, mock, reset, verify, when } from 'ts-mockito'
import path from 'path'

let localWriter: LocalWriter
const mockFileSystemWrapper = mock(FileSystemWrapper)
const fileUsage = 'cache'
const dataType = 'json'
const dirName = 'repos'
const filePath = 'test.json'
const expectedDirPath = path.resolve('data', fileUsage, dataType, dirName)
const expectedFilePath = path.resolve('data', fileUsage, dataType, dirName, filePath)

test.beforeEach(t => {
  localWriter = new LocalWriter(instance(mockFileSystemWrapper))
  reset(mockFileSystemWrapper)
})

/**
 * ensureDataTypeMatchesFileType() tests
 */
test.serial('ensureDataTypeMatchesFileType() should return false if the filePath extension and dataType do not match', async t => {
  t.false(localWriter.ensureDataTypeMatchesFileType(dataType, 'test.csv'))
})

/**
 * deleteAllFilesInDirectory() tests
 */
test.serial('deleteAllFilesInDirectory() should attempt to call FileSystemWrapper.rm(<directoryPath>)', async t => {
  await localWriter.deleteAllFilesInDirectory(fileUsage, dataType, dirName)
  verify(mockFileSystemWrapper.rm(expectedDirPath))
})

/**
 * ensureDirectoryStructureExists() tests
 */
test.serial('ensureDirectoryStructureExists() should call fs.mkdir() if fs.access throws an error', async t => {
  when(mockFileSystemWrapper.access(expectedDirPath)).thenThrow(new Error())
  await localWriter.ensureDirectoryStructureExists(expectedFilePath)
  verify(mockFileSystemWrapper.access(expectedDirPath)).times(1)
  verify(mockFileSystemWrapper.mkdir(expectedDirPath)).times(1)
})

test.serial('ensureDirectoryStructureExists() should not call fs.mkdir() if fs.access does not throw', async t => {
  when(mockFileSystemWrapper.access(expectedDirPath)).thenResolve()
  await localWriter.ensureDirectoryStructureExists(expectedFilePath)
  verify(mockFileSystemWrapper.access(expectedDirPath)).times(1)
  verify(mockFileSystemWrapper.mkdir(expectedDirPath)).times(0)
})
