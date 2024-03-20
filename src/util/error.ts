import { logger } from './logger'

export class WarningError extends Error {}
export class ParsingError extends WarningError {}

export function errorHandler (error: unknown, functionName: string, repoName: string = '', branchName: string = '', fileName: string = ''): void {
  const errorMessage = (error instanceof Error || error instanceof ParsingError) ? error.message : String(error)

  const repoInfo = (repoName !== '') ? ` for repo: ${repoName}` : ''
  const branchInfo = (branchName !== '') ? `, for branch: ${branchName}` : ''
  const fileInfo = (fileName !== '') ? `, for fileName: ${fileName}` : ''

  const errorInfo = ` in ${functionName}${repoInfo}${branchInfo}${fileInfo}, message: ${errorMessage}`

  if (error instanceof WarningError) {
    logger.warn('Problem' + errorInfo)
  } else {
    logger.error('Problem' + errorInfo)
  }
}
