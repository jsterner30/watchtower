import test from 'ava'
import { LocalWriter, FileSystemWrapper } from '../src/util'
import { instance, mock, reset, verify, when } from 'ts-mockito'
import path from 'path'
import * as sinon from 'sinon'

let localWriter: LocalWriter
const mockFileSystemWrapper = mock(FileSystemWrapper)
const fileUsage = 'cache'
const dataType = 'json'
const directoryPath = 'repos'
const fileName = 'test.json'
const expectedDirPath = path.resolve('data', fileUsage, dataType, directoryPath)
const expectedFilePath = path.resolve('data', fileUsage, dataType, directoryPath, fileName)

test.beforeEach(t => {
  localWriter = new LocalWriter(instance(mockFileSystemWrapper))
  reset(mockFileSystemWrapper)
})

/**
 * ensureDataTypeMatchesFileType() tests
 */
test.serial('local.ensureDataTypeMatchesFileType() should return false if the filePath extension and dataType do not match', async t => {
  t.false(localWriter.ensureDataTypeMatchesFileType(dataType, 'test.csv'))
})

test.serial('local.ensureDataTypeMatchesFileType() should return true if the filePath extension and dataType match', async t => {
  t.true(localWriter.ensureDataTypeMatchesFileType(dataType, fileName))
})

/**
 * deleteAllFilesInDirectory() tests
 */
test.serial('deleteAllFilesInDirectory() should attempt to call FileSystemWrapper.rm(<directoryPath>)', async t => {
  when(mockFileSystemWrapper.rm(expectedDirPath)).thenResolve()
  await localWriter.deleteAllFilesInDirectory(fileUsage, dataType, directoryPath)
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

/**
 * readFile() tests
 */
test.serial('readFile() should return the null if fs.readFile() throws', async t => {
  when(mockFileSystemWrapper.readFile(expectedFilePath)).thenThrow(new Error())
  const res = await localWriter.readFile(fileUsage, dataType, path.join(directoryPath, fileName))
  verify(mockFileSystemWrapper.readFile(expectedFilePath)).times(1)
  t.deepEqual(res, null)
})

test.serial('readFile() should return the string returned by fs.readFile()', async t => {
  const expectedString = 'orange'
  when(mockFileSystemWrapper.readFile(expectedFilePath)).thenResolve(expectedString)
  const res = await localWriter.readFile(fileUsage, dataType, path.join(directoryPath, fileName))
  verify(mockFileSystemWrapper.readFile(expectedFilePath)).times(1)
  t.deepEqual(res, expectedString)
})

/**
 * readAllFilesInDirectory() tests
 */
test.serial('readAllFilesInDirectory() should return null if fs.readdr() throws', async t => {
  when(mockFileSystemWrapper.readdir(expectedDirPath)).thenThrow()
  const files = await localWriter.readAllFilesInDirectory(fileUsage, dataType, directoryPath)
  verify(mockFileSystemWrapper.readdir(expectedDirPath)).times(1)
  t.deepEqual(files, null)
})

test.serial('readAllFilesInDirectory() should return an array of objects with null values when readFile returns null', async t => {
  when(mockFileSystemWrapper.readdir(expectedDirPath)).thenResolve([fileName])
  const readFileStub = sinon.stub(localWriter, 'readFile')
  readFileStub.resolves(null)
  const files = await localWriter.readAllFilesInDirectory(fileUsage, dataType, directoryPath)
  verify(mockFileSystemWrapper.readdir(expectedDirPath)).times(1)
  t.deepEqual(files, { [fileName]: null })
})

test.serial('readAllFilesInDirectory() should return an array of objects with string values when readFile returns a string', async t => {
  when(mockFileSystemWrapper.readdir(expectedDirPath)).thenResolve([fileName])
  const readFileStub = sinon.stub(localWriter, 'readFile')
  readFileStub.resolves('{}')
  const files = await localWriter.readAllFilesInDirectory(fileUsage, dataType, directoryPath)
  verify(mockFileSystemWrapper.readdir(expectedDirPath)).times(1)
  t.deepEqual(files, { [fileName]: '{}' })
})

/**
 * writeFile() tests
 */
test.serial('writeFile() should attempt to call fs.writeFile() with expected input', async t => {
  when(mockFileSystemWrapper.writeFile(expectedFilePath, '{}')).thenResolve()
  const ensureDirStructStub = sinon.stub(localWriter, 'ensureDirectoryStructureExists')
  ensureDirStructStub.resolves()
  await localWriter.writeFile(fileUsage, dataType, path.join(directoryPath, fileName), '{}')
  verify(mockFileSystemWrapper.writeFile(expectedFilePath, '{}')).times(1)
})
