import { Commit } from '../types'

export const startingLowestVersion = '100.0.0'
export const startingHighestVersion = '0.0.0'

export const nodeLTSUrl = 'https://raw.githubusercontent.com/nodejs/Release/main/schedule.json'

export const lastRunDateFileName = 'lastRunDate.json'
export const allReposCacheFileName = 'allRepos.json'
export const filteredWithBranchesCacheFileName = 'filteredWithBranches.json'

export const defaultCommit: Commit = {
  author: 'unknown',
  date: '0000-00-00T00:00:00Z',
  message: ''
}
