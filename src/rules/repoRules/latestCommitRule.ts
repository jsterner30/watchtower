import { errorHandler, getEnv } from '../../util'
import type { RepoInfo } from '../../types'
import { RepoRule } from '../rule'

export class LatestCommitRule extends RepoRule {
  async run (repo: RepoInfo): Promise<void> {
    try {
      const { data: commits } = await this.octokit.repos.listCommits({
        owner: (await getEnv()).githubOrg,
        repo: repo.name,
        per_page: 30
      })
      let oldestUnfilteredCommit = commits[0]
      for (const commit of commits) {
        if (!(commit.commit.message?.toLowerCase().includes('repo-meta') || commit.commit.message?.toLowerCase().includes('repo_meta')) && // exclude repo-meta commits
            !(commit.commit?.author?.name?.toLowerCase().includes('service account') ?? false) && // exclude service account commits
            !(commit.commit?.message?.toLowerCase().includes('license')) && // exclude adding license commits
            !(commit.commit?.message?.toLowerCase().includes('maintained_by')) && // exclude changes to repo-meta file maintained_by commits
            !(commit.commit?.message?.toLowerCase().includes('richardskg/patch-1')) // exclude the merged PRs of changes to repo-meta file maintained_by commits
        ) { // filter out non-meaningful commits
          oldestUnfilteredCommit = commit
          break
        }
      }

      if (commits.length > 0) {
        repo.lastCommit.date = oldestUnfilteredCommit.commit.author?.date ?? 'unknown'
        repo.lastCommit.author = oldestUnfilteredCommit.commit.author?.name ?? '1971-01-01T00:00:00Z'
      }
    } catch (error) {
      errorHandler(error, LatestCommitRule.name, repo.name)
    }
  }
}
