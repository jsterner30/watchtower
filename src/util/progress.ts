import ProgressBar from 'progress'

export interface ProgressToken {
  displayName: string
  token: string
  value?: string
}

export class ProgressBarManager {
  // progress bar is only actually shown if this is set to true
  private progressBar: ProgressBar
  private readonly showProgress: boolean

  constructor (showProgress: boolean) {
    this.showProgress = showProgress
    this.progressBar = new ProgressBar(this.getFormatString('', []), {
      complete: '=',
      incomplete: ' ',
      width: 40,
      total: 100
    })
  }

  reset (totalIterations: number, action: string, tokenArray: ProgressToken[]): void {
    const format = this.getFormatString(action, tokenArray)
    this.progressBar = new ProgressBar(format, {
      complete: '=',
      incomplete: ' ',
      width: 40,
      total: totalIterations
    })
  }

  update (tokenArray: ProgressToken[]): void {
    if (this.showProgress) {
      const tokens: Record<string, any> = {}
      for (const token of tokenArray) {
        tokens[token.token] = token.value
      }

      this.progressBar.tick(tokens)
    }
  }

  start (): void {
    if (this.showProgress) {
      this.progressBar.render()
    }
  }

  getFormatString (action: string, tokenArray: ProgressToken[]): string {
    let format = `${action} [:bar] :current/:total`
    for (const token of tokenArray) {
      format += `  |  ${token.displayName}: :${token.token}`
    }

    return format
  }
}
