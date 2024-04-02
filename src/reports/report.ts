import { Data, errorHandler, Exception, HeaderTitles, ReportWriter } from '../util'
import { ReportType } from '../types'

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
  protected _reportWriters: Record<string, ReportWriter<T>>
  protected _description: string
  protected _numberOfFilesOutputDescription: string
  protected _type: ReportType

  constructor (weight: number, outputDir: string, description: string, numberOfFilesOutputDescription: string, type: ReportType) {
    this._weight = weight
    this._outputDir = outputDir
    this._reportWriters = this.initReportWriters()
    this._description = description
    this._numberOfFilesOutputDescription = numberOfFilesOutputDescription
    this._type = type
  }

  public async run (item: V): Promise<void> {
    try {
      await this.runReport(item)
    } catch (error) {
      errorHandler(error, this.name, item.name)
    }
  }

  get weight (): number {
    return this._weight
  }

  public get reportWriters (): Record<string, ReportWriter<T>> {
    return this._reportWriters
  }

  public get reportWritersArray (): Array<ReportWriter<T>> {
    return Object.values(this._reportWriters)
  }

  get description (): string {
    return this._description
  }

  get type (): string {
    return this._type
  }

  get numberOfFilesOutputDescription (): string {
    return this._numberOfFilesOutputDescription
  }

  get outputDir (): string {
    return this._outputDir
  }

  protected getExceptions (): Array<Exception<T>> {
    return []
  }

  public abstract get name (): string
  protected abstract getHeaderTitles (): HeaderTitles<T>
  protected abstract initReportWriters (): U
  protected abstract runReport (item: V): Promise<void>
}
