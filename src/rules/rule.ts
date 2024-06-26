
// A rule is a function that gathers data.
// The data can be gathered from an API call, by scanning the downloaded zip file of a branch, or by other means.
// This data is then written to a JSON file to act as a cache.
import JSZip from 'jszip'
import { Repo } from '../types'

export abstract class Rule {
  abstract run (...args: any[]): Promise<void>
}

// There are four types of rules:

// A BranchRule gathers data on a branch
export abstract class BranchRule extends Rule {
  abstract run (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void>
}

//  A secondary runs after all BranchRules, rely on data gathered during branch rules
//  (for example, we cannot tell if a branch is deployed through GH Actions until we parse GHA files using the dotGithubRule, therefore it is a secondary rule)
export abstract class SecondaryBranchRule extends Rule {
  abstract run (repo: Repo, branchName: string): Promise<void>
}

// A RepoRule makes a single API call to the whole repo, then maps the data to individual branches.
// This saves us dozens of API calls.
export abstract class RepoRule extends Rule {
  abstract run (repo: Repo): Promise<void>
}

//  An OrgRule makes a single API call to the whole org, then maps the data to a repo.
//  This saves us hundreds of API calls.
export abstract class OrgRule extends Rule {
  abstract run (repos: Record<string, Repo>): Promise<void>
}
