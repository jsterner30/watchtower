import path from 'path'
import { logger } from './logger'
import { FileSystemWrapper } from './fileSystemWrapper'
import { S3Wrapper } from './s3Wrapper'

/** In s3 and locally, files are written to a structure like the following:
.
 └── data/
     ├── cache/
     │   └── json/
     │       ├── lastRunDate.json
     │       └── etc.json
     └── reports/
         ├── csv/
         │   └── reportDir/
         │       └── report.csv
         └── json/
             └── reportDir/
                 └── report.json

 the fileUsage string is either "cache" or "report". This string is used to create the first level directories below "data"
 the dataType string is either "json" or "csv". This string is used to create the directories below the "cache" and "report" directories
 the filePath string is used to specify the rest of the path, including additional parent directories (not including data/<fileUsage>/<dataType>), the file name, and file extension
 the body string is the data that is written to the file
 */

export abstract class Writer {
  abstract writeFile (fileUsage: string, dataType: string, filePath: string, body: string): Promise<void>
  abstract readFile (fileUsage: string, dataType: string, filePath: string): Promise<string | null>
  abstract readAllFilesInDirectory (fileUsage: string, dataType: string, directoryPath: string): Promise<Record<string, string | null> | null>
  abstract deleteAllFilesInDirectory (fileUsage: string, dataType: string, directoryPath: string): Promise<void>
  abstract listAllFilesInDirectory (fileUsage: string, dataType: string, directoryPath: string): Promise<string[]>
  abstract getFullDirectoryPath (fileUsage: string, dataType: string, directoryPath: string): string

  ensureDataTypeMatchesFileType (dataType: string, filePath: string): boolean {
    const fileType = path.extname(filePath).slice(1)
    if (fileType == null) {
      logger.debug(`Filepath: ${filePath} does not include a file extension, but probably should (this message can be ignored if this was purposeful)`)
      return false
    } else if (fileType !== dataType) {
      logger.debug(`Filepath: ${filePath} will be in the ${dataType} directory, but the file extension does not match (this message can be ignored if this was purposeful)`)
      return false
    }
    return true
  }
}

export class LocalWriter extends Writer {
  private readonly fileSystemWrapper: FileSystemWrapper
  public constructor (fs: FileSystemWrapper = new FileSystemWrapper()) {
    super()
    this.fileSystemWrapper = fs
  }

  async readFile (fileUsage: string, dataType: string, filePath: string): Promise<string | null> {
    try {
      this.ensureDataTypeMatchesFileType(dataType, filePath)
      return await this.fileSystemWrapper.readFile(path.resolve('data', fileUsage, dataType, filePath))
    } catch (error) {
      logger.warn(`File: ${filePath} doesn't exist.`)
      return null
    }
  }

  async writeFile (fileUsage: string, dataType: string, filePath: string, body: string): Promise<void> {
    try {
      this.ensureDataTypeMatchesFileType(dataType, filePath)
      const fullPath = path.resolve('data', fileUsage, dataType, filePath)
      await this.ensureDirectoryStructureExists(fullPath)
      await this.fileSystemWrapper.writeFile(fullPath, body)
      logger.info(`JSON data successfully written to ${filePath}`)
    } catch (error) {
      logger.error('Error occurred while writing JSON data to file:', error)
    }
  }

  async readAllFilesInDirectory (fileUsage: string, dataType: string, directoryPath: string): Promise<Record<string, string | null> | null> {
    try {
      const fullPath = this.getFullDirectoryPath(fileUsage, dataType, directoryPath)
      const files = await this.listAllFilesInDirectory(fullPath)
      const fileObject: Record<string, string | null> = {}
      for (const file of files) {
        const fileContents = await this.readFile(fileUsage, dataType, path.join(directoryPath, file))

        fileObject[file] = fileContents ?? null
      }

      return fileObject
    } catch (error: any) {
      logger.warn(`Error reading local files: ${(error as Error).message}`)
      return null
    }
  }

  async deleteAllFilesInDirectory (fileUsage: string, dataType: string, directoryPath: string): Promise<void> {
    try {
      const fullPath = this.getFullDirectoryPath(fileUsage, dataType, directoryPath)
      // Remove the directory and its contents
      await this.fileSystemWrapper.rm(fullPath)
      logger.info(`Successfully deleted the directory and its contents: ${fullPath}`)
    } catch (error: any) {
      logger.error(`Error deleting directory and its contents: ${(error as Error).message}`)
    }
  }

  async ensureDirectoryStructureExists (filePath: string): Promise<void> {
    const dirPath = path.dirname(filePath)
    try {
      // Check if the directory already exists
      await this.fileSystemWrapper.access(dirPath)
    } catch (error) {
      // If not, create the directory recursively
      await this.fileSystemWrapper.mkdir(dirPath)
    }
  }

  async listAllFilesInDirectory (fileUsage: string, dataType: string = '', directoryPath: string = ''): Promise<string[]> {
    try {
      const fullPath = this.getFullDirectoryPath(fileUsage, dataType, directoryPath)
      return await this.fileSystemWrapper.readdir(fullPath)
    } catch (error) {
      logger.error(`Issue listing all files in directory: ${this.getFullDirectoryPath(fileUsage, dataType, directoryPath)}, ${(error as Error).message}`)
      return []
    }
  }

  getFullDirectoryPath (fileUsage: string, dataType: string = '', directoryPath: string = ''): string {
    return path.resolve('data', fileUsage, dataType, directoryPath)
  }
}

export class S3Writer extends Writer {
  private readonly s3Wrapper: S3Wrapper
  public constructor (bucketName: string, client: S3Wrapper = new S3Wrapper('us-west-2', bucketName)) {
    super()
    this.s3Wrapper = client
  }

  async readFile (fileUsage: string, dataType: string, filePath: string): Promise<string | null> {
    return await this.s3Wrapper.readFile(`data/${fileUsage}/${dataType}/${filePath}`)
  }

  async writeFile (fileUsage: string, dataType: string, filePath: string, body: string): Promise<void> {
    await this.s3Wrapper.writeFile(`data/${fileUsage}/${dataType}/${filePath}`, body)
  }

  async readAllFilesInDirectory (fileUsage: string, dataType: string = '', directoryPath: string = ''): Promise<Record<string, string | null> | null> {
    logger.info(`Reading all files in directory: ${this.getFullDirectoryPath(fileUsage, dataType, directoryPath)}`)
    const files = await this.listAllFilesInDirectory(fileUsage, dataType, directoryPath)

    const fileObject: Record<string, string | null> = {}
    for (const file of files) {
      const filePath = file.split('json/')[1]
      fileObject[file] = await this.readFile('cache', 'json', filePath)
    }
    return fileObject
  }

  async deleteAllFilesInDirectory (fileUsage: string, dataType: string = '', directoryPath: string = ''): Promise<void> {
    const files = await this.listAllFilesInDirectory(fileUsage, dataType, directoryPath)
    for (const file of files) {
      await this.s3Wrapper.deleteObject(file)
    }
    logger.info(`Successfully deleted all files in the directory: ${this.getFullDirectoryPath(fileUsage, dataType, directoryPath)}`)
  }

  async listAllFilesInDirectory (fileUsage: string, dataType: string = '', directoryPath: string = ''): Promise<string[]> {
    const fullPath = this.getFullDirectoryPath(fileUsage, dataType, directoryPath)
    const data = await this.s3Wrapper.listObjects(fullPath)
    if (data == null) {
      logger.error(`No s3 files found in the directory: ${fullPath}`)
      return []
    }
    return data
  }

  getFullDirectoryPath (fileUsage: string, dataType: string = '', directoryPath: string = ''): string {
    let fullPath: string = `data/${fileUsage}/`
    if (dataType !== '') {
      fullPath = `${fullPath}${dataType}/`
      if (directoryPath !== '') {
        fullPath = `${fullPath}${directoryPath}/`
      }
    }
    return fullPath
  }
}
