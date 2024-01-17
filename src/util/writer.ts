import { getEnv } from './env'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { promises as fs } from 'fs'
import path from 'path'
import { logger } from './logger'

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
  abstract deleteFile (fileUsage: string, dataType: string, filePath: string): Promise<void>
  abstract readAllFilesInDirectory (fileUsage: string, dataType: string, directoryPath: string): Promise<Record<string, string | null> | null>
  abstract deleteAllFilesInDirectory (fileUsage: string, dataType: string, directoryPath: string): Promise<void>

  ensureDataTypeMatchesFileType (dataType: string, filePath: string): void {
    const fileType = filePath.split('.')[1]
    if (fileType == null) {
      logger.error(`Filepath: ${filePath} does not include a file extension, but probably should (this message can be ignored if this was purposeful)`)
    } else if (fileType !== dataType) {
      logger.error(`Filepath: ${filePath} will be in the ${dataType} directory, but the file extension does not match (this message can be ignored if this was purposeful)`)
    }
  }
}

export class LocalWriter extends Writer {
  async deleteFile (fileUsage: string, dataType: string, filePath: string): Promise<void> {
    try {
      this.ensureDataTypeMatchesFileType(dataType, filePath)
      await fs.unlink(path.resolve('data', fileUsage, dataType, filePath))
      logger.info(`File ${filePath} deleted successfully.`)
    } catch (error) {
      logger.error(`Error deleting file: ${error as string}`)
    }
  }

  async readFile (fileUsage: string, dataType: string, filePath: string): Promise<string | null> {
    try {
      this.ensureDataTypeMatchesFileType(dataType, filePath)
      return await fs.readFile(path.resolve('data', fileUsage, dataType, filePath), 'utf-8')
    } catch (error) {
      logger.error(`File: ${filePath} doesn't exist.`)
      return null
    }
  }

  async writeFile (fileUsage: string, dataType: string, filePath: string, body: string): Promise<void> {
    try {
      this.ensureDataTypeMatchesFileType(dataType, filePath)
      const fullPath = `data/${fileUsage}/${dataType}/${filePath}`
      await this.ensureDirectoryStructureExists(fullPath)
      await fs.writeFile(path.resolve('data', fileUsage, dataType, filePath), body)
      logger.info(`JSON data successfully written to ${filePath}`)
    } catch (error) {
      logger.error('Error occurred while writing JSON data to file:', error)
    }
  }

  async readAllFilesInDirectory (fileUsage: string, dataType: string, directoryPath: string): Promise<Record<string, string | null> | null> {
    try {
      const files = await fs.readdir(path.resolve('data', fileUsage, dataType, directoryPath))

      if (files != null) {
        const fileObject: Record<string, string | null> = {}

        await Promise.all(
          files.map(async (file) => {
            const filePath = path.join(directoryPath, file)
            const fileContents = await this.readFile(fileUsage, dataType, filePath)

            fileObject[file] = fileContents ?? null
          })
        )

        return fileObject
      } else {
        logger.error(`No local files found in the directory: ${directoryPath}`)
        return null
      }
    } catch (error: any) {
      logger.error(`Error reading local files: ${error as string}`)
      return null
    }
  }

  async deleteAllFilesInDirectory (fileUsage: string, dataType: string, directoryPath: string): Promise<void> {
    try {
      const files = await fs.readdir(path.resolve('data', fileUsage, dataType, directoryPath))

      if (files != null) {
        await Promise.all(
          files.map(async (file) => {
            const filePath = path.join(directoryPath, file)
            await fs.unlink(filePath)
          })
        )

        logger.info(`Successfully deleted all local files in the directory: ${directoryPath}`)
      } else {
        logger.info(`No local files found in the directory: ${directoryPath}`)
      }
    } catch (error: any) {
      logger.error(`Error deleting local files: ${error as string}`)
    }
  }

  async ensureDirectoryStructureExists (filePath: string): Promise<void> {
    const dirPath = path.dirname(filePath)
    try {
      // Check if the directory already exists
      await fs.access(dirPath)
    } catch (error) {
      // If not, create the directory recursively
      await fs.mkdir(dirPath, { recursive: true })
    }
  }
}

export class S3Writer extends Writer {
  private readonly client = new S3Client({ region: 'us-west-2' })

  async deleteFile (fileUsage: string, dataType: string, filePath: string): Promise<void> {
    try {
      this.ensureDataTypeMatchesFileType(dataType, filePath)
      const params = {
        Bucket: (await getEnv()).bucketName,
        Key: `data/${fileUsage}/${dataType}/${filePath}`
      }

      await this.client.send(new DeleteObjectCommand(params))
    } catch (e) {
      logger.error('There was an error removing S3 object')
    }
  }

  async readFile (fileUsage: string, dataType: string, filePath: string): Promise<string | null> {
    try {
      this.ensureDataTypeMatchesFileType(dataType, filePath)
      const params = {
        Bucket: (await getEnv()).bucketName,
        Key: `data/${fileUsage}/${dataType}/${filePath}`
      }
      const data = await this.client.send(new GetObjectCommand(params))
      if (data.Body == null) {
        // this error is caught by the catch block in this function, then a more descriptive error can be thrown
        throw new Error()
      }
      return await data.Body.transformToString()
    } catch (e: any) {
      if (e.$metadata.httpStatusCode === 404) {
        logger.error(`"${filePath}" not found in s3`)
      } else {
        logger.error(`There was an error getting config object from s3: ${e as string}`)
      }
      return null
    }
  }

  async writeFile (fileUsage: string, dataType: string, filePath: string, body: string): Promise<void> {
    try {
      this.ensureDataTypeMatchesFileType(dataType, filePath)
      const params = {
        Bucket: (await getEnv()).bucketName,
        Key: `data/${fileUsage}/${dataType}/${filePath}`,
        Body: body
      }

      await this.client.send(new PutObjectCommand(params))
    } catch (e) {
      logger.error('There was an error updating s3 object')
    }
  }

  async readAllFilesInDirectory (fileUsage: string, dataType: string, directoryPath: string): Promise<Record<string, string | null> | null> {
    try {
      const bucketName = (await getEnv()).bucketName
      const params = {
        Bucket: bucketName,
        Prefix: `data/${fileUsage}/${dataType}/${directoryPath}/`
      }

      const data = await this.client.send(new ListObjectsCommand(params))

      if (data.Contents != null) {
        const fileObject: Record<string, string | null> = {}

        await Promise.all(
          data.Contents.map(async (file) => {
            if (file.Key != null) {
              const filePath = file.Key.split('json/')[1]
              const fileContents = await this.readFile('cache', 'json',  filePath)

              fileObject[file.Key] = fileContents ?? null
            }
          })
        )

        return fileObject
      } else {
        logger.error(`No s3 files found in the directory: ${directoryPath}`)
        return null
      }
    } catch (e: any) {
      logger.error(`Error reading files from S3: ${e as string}`)
      return null
    }
  }

  async deleteAllFilesInDirectory (fileUsage: string, dataType: string, directoryPath: string): Promise<void> {
    try {
      const bucketName = (await getEnv()).bucketName
      const params = {
        Bucket: bucketName,
        Prefix: `data/${fileUsage}/${dataType}/${directoryPath}/`
      }

      const data = await this.client.send(new ListObjectsCommand(params))

      if (data.Contents != null) {
        await Promise.all(
          data.Contents.map(async (file) => {
            const deleteParams = {
              Bucket: bucketName,
              Key: file.Key
            }

            await this.client.send(new DeleteObjectCommand(deleteParams))
          })
        )

        logger.info(`Successfully deleted all files in the directory: ${directoryPath}`)
      } else {
        logger.info(`No S3 files found in the directory: ${directoryPath}`)
      }
    } catch (e: any) {
      logger.error(`Error deleting files from S3: ${e.message as string}`)
    }
  }
}
