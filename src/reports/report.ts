import { Data, errorHandler, HeaderTitles, ReportWriter } from '../util'

export interface ReportData extends Data {}
export interface Writers<T extends ReportData> extends Record<string, ReportWriter<T>> {}
export interface NamedItem {
  name: string
}

// Reports are functions that aggregate the data gathered by a rule and output it to a csv and json file.
// They run very quickly and therefore have no need to be cached.
export abstract class Report<T extends ReportData, U extends Writers<T>, V extends NamedItem> {
  protected _weight: number
  protected _outputDir: string
  protected _reportOutputDataWriters: Array<ReportWriter<T>>

  constructor (weight: number, outputDir: string) {
    this._weight = weight
    this._outputDir = outputDir
    this._reportOutputDataWriters = []
  }

  public async run (items: V[]): Promise<void> {
    const writers: U = this.getReportWriters()
    for (const item of items) {
      try {
        await this.runReport(item, writers)
      } catch (error) {
        errorHandler(error, this.name, item.name)
      }
    }

    for (const writer in writers) {
      this._reportOutputDataWriters.push(writers[writer])
    }
  }

  get weight (): number {
    return this._weight
  }

  public get reportOutputDataWriters (): Array<ReportWriter<T>> {
    return this._reportOutputDataWriters
  }

  public abstract get name (): string
  protected abstract getHeaderTitles (): HeaderTitles<T>
  protected abstract getReportWriters (): U
  protected abstract runReport (item: V, writers: U): Promise<void>
}
