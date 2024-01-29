import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { logger } from './logger'

export class S3Wrapper {
  private readonly client: S3Client
  private readonly bucketName: string

  constructor (region: string, bucketName: string) {
    this.client = new S3Client({ region })
    this.bucketName = bucketName
  }

  async readFile (key: string): Promise<string | null> {
    try {
      const params = { Bucket: this.bucketName, Key: key }
      const data = await this.client.send(new GetObjectCommand(params))

      if (data.Body == null) {
        throw new Error('Empty response body')
      }

      return await data.Body.transformToString()
    } catch (e: any) {
      if (e.$metadata.httpStatusCode === 404) {
        logger.error(`"${key}" not found in s3`)
      } else {
        logger.error(`There was an error getting config object from s3: ${e as string}`)
      }
      return null
    }
  }

  async writeFile (key: string, body: string): Promise<void> {
    try {
      const params = { Bucket: this.bucketName, Key: key, Body: body }
      await this.client.send(new PutObjectCommand(params))
    } catch (error) {
      logger.error(`Error writing file to S3: ${error as string}`)
    }
  }

  async listObjects (prefix: string): Promise<string[] | null> {
    try {
      const params = { Bucket: this.bucketName, Prefix: prefix }
      const data = await this.client.send(new ListObjectsCommand(params))

      if (data.Contents != null) {
        return data.Contents.map((obj) => obj.Key as string)
      } else {
        logger.error(`No objects found with prefix: ${prefix}`)
        return null
      }
    } catch (error) {
      logger.error(`Error listing objects in S3: ${error as string}`)
      return null
    }
  }

  async deleteObject (key: string): Promise<void> {
    try {
      const params = { Bucket: this.bucketName, Key: key }
      await this.client.send(new DeleteObjectCommand(params))
    } catch (error) {
      logger.error(`Error deleting object from S3: ${error as string}`)
    }
  }
}
