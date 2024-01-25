import * as fsPromises from 'fs/promises'
import * as path from 'path'
import { promises as fs } from 'fs'

export class FileSystemWrapper {
  async readFile (filePath: string): Promise<string> {
    return await fsPromises.readFile(filePath, 'utf-8')
  }

  async writeFile (filePath: string, data: string): Promise<void> {
    await fsPromises.writeFile(filePath, data, 'utf-8')
  }

  async readdir (directoryPath: string): Promise<string[]> {
    return await fsPromises.readdir(path.resolve(directoryPath))
  }

  async rm (directoryFullPath: string): Promise<void> {
    await fsPromises.rm(directoryFullPath, { recursive: true })
  }

  async access (dirPath: string): Promise<void> {
    await fsPromises.access(dirPath)
  }

  async mkdir (dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true })
  }
}
