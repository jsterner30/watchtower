import { Header, ReportJSONOutput } from '../types'
import { Writer } from './writer'
import { stringifyJSON } from './util'
import { createObjectCsvStringifier } from 'csv-writer'
import { logger } from './logger'

export interface Data extends Record<string, any> {}

export type HeaderTitles<T> = {
  [P in keyof T]: string
}

export class ReportWriter<T extends Data> {
  private readonly _headerTitles: HeaderTitles<T>
  private readonly _headers: Header[]
  private readonly _data: T[]
  private readonly _outputDir: string
  private readonly _fileName: string

  constructor (headerTitles: HeaderTitles<T>, outputDir: string, fileName: string) {
    this._headerTitles = headerTitles
    this._outputDir = outputDir
    this._fileName = fileName
    this._data = []
    this._headers = this.getHeader()
  }

  get data (): T[] {
    return this._data
  }

  addRows (rows: T[]): void {
    for (const row of rows) {
      this.addRow(row)
    }
  }

  addRow (row: T): void {
    if (!this.inputMatchesHeader(row)) {
      logger.error(`The row input does not match the expected header for report: ${this._fileName}, input: ${JSON.stringify(row)}`)
    } else {
      this._data.push(row)
    }
  }

  async writeOutput (writer: Writer): Promise<void> {
    if (this._data.length === 0) {
      logger.error(`No data found for report file: ${this._fileName} skipping the writing of that report`)
    } else {
      await writer.writeFile('reports', 'json', `${this._outputDir}/${this._fileName}.json`, stringifyJSON(this.convertToCorrectJsonOutput(), this._fileName))
      await writer.writeFile('reports', 'csv', `${this._outputDir}/${this._fileName}.csv`, this.convertToCSV())
    }
  }

  private convertToCSV (): string {
    const csvStringifier = createObjectCsvStringifier({
      header: this._headers
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
      header: this._headers,
      report: this._data
    }
  }

  private getHeader (): Header[] {
    const headers: Header[] = []
    for (const headerTitle in this._headerTitles) {
      headers.push({
        id: headerTitle,
        title: this._headerTitles[headerTitle]
      })
    }
    return headers
  }

  private inputMatchesHeader (input: T): boolean {
    const sortedHeaderKeys = this._headers.map(item => item.id)
    const sortedInputKeys = Object.keys(input)

    // check that the two arrays have the same elements
    return (sortedHeaderKeys.length === sortedInputKeys.length && sortedHeaderKeys.every((v) => sortedInputKeys.includes(v)))
  }
}
