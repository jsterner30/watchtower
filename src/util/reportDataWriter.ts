import { CSVWriterHeader } from '../types'
import { createObjectCsvWriter } from 'csv-writer'
import { CsvWriter } from 'csv-writer/src/lib/csv-writer'

export default class ReportDataWriter {
  writer: CsvWriter<any>
  data: Array<Record<string, any>>
  path: string

  constructor (path: string, header: CSVWriterHeader) {
    this.writer = createObjectCsvWriter({
      path,
      header
    })
    this.path = path
    this.data = []
  }

  async write (): Promise<void> {
    await this.writer.writeRecords(this.data)
  }
}
