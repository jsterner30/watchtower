import { errorHandler, getCommits } from '../../util'
import type { Repo } from '../../types'
import { RepoRule } from '../rule'

export class LatestCommitRule extends RepoRule {
  async run (repo: Repo): Promise<void> {
    try {
      const commits = await getCommits(repo.name)
      let oldestUnfilteredCommit = commits[0]
      for (const commit of commits) {
        if (!(commit.message.toLowerCase().includes('repo-meta') || commit.message.toLowerCase().includes('repo_meta')) && // exclude repo-meta commits
            !(commit.author.toLowerCase().includes('service account') ?? false) && // exclude service account commits
            !(commit.message.toLowerCase().includes('license')) && // exclude adding license commits
            !(commit.message.toLowerCase().includes('maintained_by')) && // exclude changes to repo-meta file maintained_by commits
            !(commit.message.toLowerCase().includes('richardskg/patch-1')) // exclude the merged PRs of changes to repo-meta file maintained_by commits
        ) { // filter out non-meaningful commits
          oldestUnfilteredCommit = commit
          break
        }
      }

      if (commits.length > 0) {
        repo.lastCommit.date = oldestUnfilteredCommit.date
        repo.lastCommit.author = oldestUnfilteredCommit.author
        repo.lastCommit.message = oldestUnfilteredCommit.message
      }
    } catch (error) {
      errorHandler(error, LatestCommitRule.name, repo.name)
    }
  }
}
