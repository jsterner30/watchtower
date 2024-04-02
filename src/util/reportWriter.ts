import { Header, ReportJSONOutput } from '../types'
import { Writer } from './writer'
import { stringifyJSON } from './util'
import { createObjectCsvStringifier } from 'csv-writer'
import { logger } from './logger'
import { getEnv } from './env'
import { Set as ImmutableSet } from 'immutable'
import { WriteableRegExp } from './writable'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Data {}

export type HeaderTitles<T extends Data> = {
  [P in keyof T]: string
}
export type Exception<T extends Data> = {
  [P in keyof T]: WriteableRegExp
}
export type Query<T extends Data> = {
  [P in keyof T]: WriteableRegExp
}

export class ReportWriter<T extends Data> {
  private readonly _headerTitles: HeaderTitles<T>
  private readonly _headers: Header[]
  private readonly _data: ImmutableSet<T>
  private readonly _outputDir: string
  private readonly _fileName: string
  private readonly _exceptions: Array<Exception<T>>

  constructor (headerTitles: HeaderTitles<T>, outputDir: string, fileName: string, exceptions: Array<Exception<T>>) {
    this._headerTitles = headerTitles
    this._outputDir = outputDir
    this._fileName = fileName
    this._data = ImmutableSet<T>().asMutable()
    this._headers = this.getHeader()
    this._exceptions = exceptions
  }

  get data (): T[] {
    return this._data.toArray()
  }

  addRows (rows: T[]): void {
    for (const row of rows) {
      this.addRow(row)
    }
  }

  addRow (row: T): void {
    let relevantException: Exception<T> | null

    if (this._data.has(row)) {
      logger.error(`The row input exactly matches another row already in the data for report file: ${this._fileName}, attempted to add row: ${stringifyJSON(row, 'rowData')}`)
    } else if (!this.inputMatchesHeader(row)) {
      logger.error(`The row input does not match the expected header for report: ${this._fileName}, input: ${stringifyJSON(row, 'regex exception')}`)
    } else if (getEnv().filterReportExceptions && this._exceptions.length > 0 && ((relevantException = this.testRowAgainstExceptionsRegex(row)) != null)) {
      logger.warn(`Omitting row for fileName: ${this._fileName}, row: ${stringifyJSON(row, this._fileName + ' row')} based on the following exception: ${stringifyJSON(relevantException, 'relevantException')}`)
    } else {
      this._data.add(row)
    }
  }

  getRows (query: Query<T>): T[] {
    const rows: T[] = []
    for (const row of this._data) {
      if (this.matchQueryException(query, row)) {
        rows.push(row)
      }
    }
    return rows
  }

  private matchQueryException (queryOrException: Query<T> | Exception<T>, row: T): boolean {
    let match = true
    for (const key in row) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        const value = (row[key] as Object).toString() // Convert value to string
        if (key in queryOrException) {
          const regexPattern = queryOrException[key]
          if (!regexPattern.test(value)) {
            match = false
          }
        }
      } catch (error) {
        logger.error(`Error matching query or exception in reportWriter with key: ${key}, value: ${row[key] as string}, row: ${stringifyJSON(row)}, query/exception: ${stringifyJSON(queryOrException)}`)
      }
    }
    return match
  }

  private testRowAgainstExceptionsRegex (row: T): Exception<T> | null {
    for (const exception of this._exceptions) {
      if (this.matchQueryException(exception, row)) {
        return exception
      }
    }
    return null // No values match regex
  }

  async writeOutput (writer: Writer): Promise<void> {
    if (this._data.size === 0) {
      logger.warn(`No data found for report file: ${this._fileName} skipping the writing of that report`)
    } else {
      await writer.writeFile('reports', 'json', `${this._outputDir}/${this._fileName}.json`, stringifyJSON(this.convertToJson(), this._fileName))
      await writer.writeFile('reports', 'csv', `${this._outputDir}/${this._fileName}.csv`, this.convertToCSV())
    }
  }

  private convertToCSV (): string {
    const csvStringifier = createObjectCsvStringifier({
      header: this._headers
    })

    const csvHeader = csvStringifier.getHeaderString()
    const csvData = csvStringifier.stringifyRecords(this.data)
    if (csvData != null && csvHeader != null) {
      return csvHeader + csvData
    } else {
      logger.error('Error converting data to csv. csvStringifier.getHeaderString() or csvStringifier.stringifyRecords() returned null')
      return ''
    }
  }

  private convertToJson (): ReportJSONOutput {
    return {
      header: this._headers,
      report: this.data
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
