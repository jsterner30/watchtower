import { Octokit } from '@octokit/rest'
import fetchMock from 'fetch-mock'

export function getMockOctokit (): Octokit {
  const fetch = fetchMock.sandbox().getOnce(
    'https://api.github.com/',
    { ok: true },
    {
      headers: {
        accept: 'application/vnd.github.v3+json'
      }
    }
  )
  return new Octokit({ request: { fetch } }) // https://stackoverflow.com/questions/75161695/how-to-mock-octokit-rest-repos-getcontent
}
