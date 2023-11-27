import ProgressBar from 'progress'

export interface ProgressToken {
  displayName: string
  token: string
  value?: string
}

export class ProgressBarManager {
  private readonly progressBar: ProgressBar

  constructor (totalIterations: number, action: string, tokenArray: ProgressToken[]) {
    const format = this.getFormatString(action, tokenArray)

    this.progressBar = new ProgressBar(format, {
      complete: '=',
      incomplete: ' ',
      width: 40,
      total: totalIterations
    })
  }

  update (tokenArray: ProgressToken[]): void {
    const tokens: Record<string, any> = {}
    for (const token of tokenArray) {
      tokens[token.token] = token.value
    }

    this.progressBar.tick(tokens)
  }

  start (): void {
    this.progressBar.render()
  }

  getFormatString (action: string, tokenArray: ProgressToken[]): string {
    let format = `${action} [:bar] :current/:total`
    for (const token of tokenArray) {
      format += `  |  ${token.displayName}: :${token.token}`
    }

    return format
  }
}
