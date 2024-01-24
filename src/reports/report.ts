import { HealthScore, RepoInfo } from '../types'
import { ReportOutputData } from '../util'

// Reports are functions that aggregate the data gathered by a rule and output it to a csv and json file.
// They run very quickly and therefore have no need to be cached.
export abstract class Report {
  protected _reportOutputs: ReportOutputData[]
  protected _weight: number
  protected _outputDir: string

  constructor (weight: number, outputDir: string) {
    this._weight = weight
    this._outputDir = outputDir
    this._reportOutputs = []
  }

  get reportOutputs (): ReportOutputData[] {
    return this._reportOutputs
  }

  get weight (): number {
    return this._weight
  }
  abstract get name (): string
  abstract run (repos: RepoInfo[]): Promise<void>
  abstract grade (input: unknown): HealthScore
}
