import { Header } from '../types'
import { Writer } from './writer'

export class ReportOutputData {
  private readonly _header: Header
  private readonly _data: Array<Record<string, any>>
  private readonly _outputDir: string
  private readonly _fileName: string

  constructor (header: Header, outputDir: string, fileName: string) {
    this._header = header
    this._outputDir = outputDir
    this._fileName = fileName
    this._data = []
  }

  get data (): Array<Record<string, any>> {
    return this._data
  }

  addRows (rows: Array<Record<string, any>>): void {
    for (const row of rows) {
      this._data.push(row)
    }
  }

  addRow (row: Record<string, any>): void {
    this._data.push(row)
  }

  async writeOutput (writer: Writer): Promise<void> {
    await writer.writeFile('reports', 'json', `${this._outputDir}/${this._fileName}.json`, JSON.stringify(this._data, null, 2))
    await writer.writeFile('reports', 'csv', `${this._outputDir}/${this._fileName}.csv`, this.convertToCSV(this._header, this._data))
  }

  private convertToCSV (header: Header, data: Array<Record<string, any>>): string {
    const headerRow = header.map((col) => col.title).join(',')
    const dataRows = data.map((row) =>
      header.map((col) => row[col.id]).join(',')
    )
    return [headerRow, ...dataRows].join('\n')
  }
}
