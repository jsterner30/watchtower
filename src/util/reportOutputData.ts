import { Header, ReportJSONOutput } from '../types'
import { Writer } from './writer'
import { stringifyJSON } from './util'
import { createObjectCsvStringifier } from 'csv-writer'
import { logger } from './logger'

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
      this.addRow(row)
    }
  }

  addRow (row: Record<string, any>): void {
    if (!this.inputMatchesHeader(row)) {
      logger.error(`The row input does not match the expected header for report: ${this._fileName}, input: ${JSON.stringify(row)}`)
    } else {
      this._data.push(row)
    }
  }

  async writeOutput (writer: Writer): Promise<void> {
    await writer.writeFile('reports', 'json', `${this._outputDir}/${this._fileName}.json`, stringifyJSON(this.convertToCorrectJsonOutput(), this._fileName))
    await writer.writeFile('reports', 'csv', `${this._outputDir}/${this._fileName}.csv`, this.convertToCSV())
  }

  private convertToCSV (): string {
    const csvStringifier = createObjectCsvStringifier({
      header: this._header
    })

    const csvHeader = csvStringifier.getHeaderString()
    const csvData = csvStringifier.stringifyRecords(this._data)
    if (csvData != null && csvHeader != null) {
      return csvHeader + csvData
    } else {
      logger.error('Error converting data to csv. csvStringifier.getHeaderString() or csvStringifier.stringifyRecords() returned null')
      return ''
    }
  }

  private convertToCorrectJsonOutput (): ReportJSONOutput {
    return {
      header: this._header,
      report: this._data
    }
  }

  private inputMatchesHeader (input: Record<string, any>): boolean {
    const sortedHeaderKeys = this._header.map(item => item.id)
    const sortedInputKeys = Object.keys(input)

    // check that the two arrays have the same elements
    return (sortedHeaderKeys.length === sortedInputKeys.length && sortedHeaderKeys.every((v) => sortedInputKeys.includes(v)))
  }
}
