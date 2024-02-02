import test from 'ava'
import { S3Wrapper, S3Writer } from '../src/util'
import { instance, mock, reset, verify, when } from 'ts-mockito'
import * as sinon from 'sinon'

let s3Writer: S3Writer
const mocks3Wrapper = mock(S3Wrapper)
const fileUsage = 'cache'
const dataType = 'json'
const directoryPath = 'repos'
const fileName = 'test.json'
const expectedDirPath = `data/${fileUsage}/${dataType}/${directoryPath}/`
const expectedFilePath = `data/${fileUsage}/${dataType}/${directoryPath}/${fileName}`

test.beforeEach(t => {
  s3Writer = new S3Writer('test-bucket', instance(mocks3Wrapper))
  reset(mocks3Wrapper)
})

/**
 * ensureDataTypeMatchesFileType() tests
 */
test.serial('s3.ensureDataTypeMatchesFileType() should return false if the filePath extension and dataType do not match', async t => {
  t.false(s3Writer.ensureDataTypeMatchesFileType(dataType, 'test.csv'))
})

test.serial('s3.ensureDataTypeMatchesFileType() should return true if the filePath extension and dataType do not match', async t => {
  t.true(s3Writer.ensureDataTypeMatchesFileType(dataType, fileName))
})

/**
 * deleteAllFilesInDirectory() tests
 */
test.serial('deleteAllFilesInDirectory() should attempt to call s3Wrapper.listObjects(<directoryPath> and s3Wrapper.deleteObject() for each file returned by listObjects())', async t => {
  when(mocks3Wrapper.listObjects(expectedDirPath)).thenResolve([expectedFilePath, expectedFilePath])
  await s3Writer.deleteAllFilesInDirectory(fileUsage, dataType, directoryPath)
  verify(mocks3Wrapper.listObjects(expectedDirPath)).times(1)
  verify(mocks3Wrapper.deleteObject(expectedFilePath)).times(2)
})

/**
 * readFile() tests
 */
test.serial('readFile() should return the null if s3Wrapper.readFile() returns null', async t => {
  when(mocks3Wrapper.readFile(expectedFilePath)).thenResolve(null)
  const res = await s3Writer.readFile(fileUsage, dataType, directoryPath + '/' + fileName)
  verify(mocks3Wrapper.readFile(expectedFilePath)).times(1)
  t.deepEqual(res, null)
})

test.serial('readFile() should return the string returned by s3Wrapper.readFile()', async t => {
  const expectedString = 'orange'
  when(mocks3Wrapper.readFile(expectedFilePath)).thenResolve(expectedString)
  const res = await s3Writer.readFile(fileUsage, dataType, directoryPath + '/' + fileName)
  verify(mocks3Wrapper.readFile(expectedFilePath)).times(1)
  t.deepEqual(res, expectedString)
})

/**
 * readAllFilesInDirectory() tests
 */
test.serial('readAllFilesInDirectory() should return null if s3Wrapper.listObjects() returns null', async t => {
  when(mocks3Wrapper.listObjects(expectedDirPath)).thenResolve(null)
  const files = await s3Writer.readAllFilesInDirectory(fileUsage, dataType, directoryPath)
  verify(mocks3Wrapper.listObjects(expectedDirPath)).times(1)
  t.deepEqual(files, null)
})

test.serial('readAllFilesInDirectory() should return an array of objects with null values when readFile returns null', async t => {
  when(mocks3Wrapper.listObjects(expectedDirPath)).thenResolve([fileName])
  const readFileStub = sinon.stub(s3Writer, 'readFile')
  readFileStub.resolves(null)
  const files = await s3Writer.readAllFilesInDirectory(fileUsage, dataType, directoryPath)
  verify(mocks3Wrapper.listObjects(expectedDirPath)).times(1)
  t.deepEqual(files, { [fileName]: null })
})

test.serial('readAllFilesInDirectory() should return an array of objects with string values when readFile returns a string', async t => {
  when(mocks3Wrapper.listObjects(expectedDirPath)).thenResolve([fileName])
  const readFileStub = sinon.stub(s3Writer, 'readFile')
  readFileStub.resolves('{}')
  const files = await s3Writer.readAllFilesInDirectory(fileUsage, dataType, directoryPath)
  verify(mocks3Wrapper.listObjects(expectedDirPath)).times(1)
  t.deepEqual(files, { [fileName]: '{}' })
})

/**
 * writeFile() tests
 */
test.serial('writeFile() should attempt to call fs.writeFile() with expected input', async t => {
  when(mocks3Wrapper.writeFile(expectedFilePath, '{}')).thenResolve()
  await s3Writer.writeFile(fileUsage, dataType, directoryPath + '/' + fileName, '{}')
  verify(mocks3Wrapper.writeFile(expectedFilePath, '{}')).times(1)
})
