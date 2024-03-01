import { Octokit } from '@octokit/rest'
import { throttling } from "@octokit/plugin-throttling"
import { retry } from '@octokit/plugin-retry'
import { getEnv } from './env'

let octokit: Octokit | null = null

export async function getOctokit (): Promise<Octokit> {
  if (octokit === null) {
    const MyOctokit = Octokit.plugin(throttling, retry)
    octokit = new MyOctokit({
      auth: (await getEnv()).githubToken,
      // todo: retries seem to conflict with throttling
      // request: {
      //   retries: 5
      // },
      throttle: {
        minimalSecondaryRateRetryAfter: 1800, // 30 Minutes
        onRateLimit: (retryAfter: number, options: any, octokit: any, retryCount: number) => {
          octokit.log.warn(`Request quota exhausted for request ${options.method as string} ${options.url as string}`)

          if (retryCount < 1) {
            // only retries once
            const restartTime = new Date(Date.now() + retryAfter * 1000)
            octokit.log.warn(`Retrying after ${retryAfter} seconds! - try number ${retryCount}. Will restart at ${restartTime.getHours()}:${restartTime.getMinutes()}.`)
            return true
          }
        },
        onSecondaryRateLimit: (retryAfter: number, options: any, octokit: any, retryCount: number) => {
          if (retryCount < 1) {
            // only retries once
            const restartTime = new Date(Date.now() + retryAfter * 1000)
            octokit.log.warn(`Retrying secondary after ${retryAfter} seconds! - try number ${retryCount}. Will restart at ${restartTime.getHours()}:${restartTime.getMinutes()}.`)
            return true
          } else {
            octokit.log.warn(`SecondaryRateLimit detected for request ${options.method as string} ${options.url as string}`)
            return false
          }
        }
      }
    })
  }

  return octokit
}
