import { Commit } from '../types'
import { WriteableRegExp } from './writable'

export const startingLowestVersion = '100.0.0'
export const startingHighestVersion = '0.0.0'

export const nodeLTSUrl = 'https://raw.githubusercontent.com/nodejs/Release/main/schedule.json'

export const defaultCommit: Commit = {
  author: 'unknown',
  date: '0000-00-00T00:00:00Z',
  message: '',
  sha: ''
}

export const date1970: string = '1970-01-01T00:00:00Z'
export const anyStringRegex = new WriteableRegExp(/.*/)
