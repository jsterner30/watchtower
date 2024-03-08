import {
  getEnv,
  defaultCommit,
  getOctokit
} from './index'
import { logger } from './logger'
import JSZip, { loadAsync } from 'jszip'
import type {
  Repo,
  Commit,
  BranchProtection,
  GithubMember,
  OctokitOptions,
  GithubOrganization,
  GithubTeam,
  Branch,
  SecretScanAlert,
  CodeScanAlert,
  DependabotAlert,
  GithubActionRun,
  Issue,
  PullRequest,
  RepoCustomProperty,
  SecretAlertLocation
} from '../types'

function getRepoParser (): (repo: any) => Promise<Repo> {
  return async (repo: any): Promise<Repo> => {
    const customProps: Record<string, RepoCustomProperty> = (await getRepoCustomProperties(repo.name)).reduce((acc: Record<string, RepoCustomProperty>, prop) => {
      acc[prop.propertyName] = prop
      return acc
    }, {})

    return {
      name: repo.name,
      private: repo.private,
      url: repo.url,
      description: repo.description ?? '',
      language: repo.language ?? '',
      allowForking: repo.allow_forking,
      visibility: repo.visibility,
      forksCount: repo.forks_count,
      archived: repo.archived,
      defaultBranch: repo.default_branch,
      branches: {},
      lastCommit: defaultCommit,
      openPullRequests: [],
      openIssues: [],
      licenseData: {
        key: repo.license?.key != null ? repo.license.key : 'none',
        name: repo.license?.name != null ? repo.license.name : '',
        url: repo.license?.url != null ? repo.license.url : ''
      },
      codeScanAlerts: {
        low: [],
        medium: [],
        high: [],
        critical: [],
        none: []
      },
      dependabotScanAlerts: {
        low: [],
        medium: [],
        high: [],
        critical: [],
        none: []
      },
      secretScanAlerts: {
        low: [],
        medium: [],
        high: [],
        critical: [],
        none: []
      },
      teams: [],
      admins: [],
      healthScores: {},
      reportResults: {
        staleBranchCount: -1,
        dependabotBranchCount: -1,
        lowNodeVersion: '??',
        highNodeVersion: '??',
        lowTerraformVersion: '??',
        highTerraformVersion: '??',
        lowPythonVersion: '??',
        highPythonVersion: '??',
        followsDevPrdNamingScheme: false
      },
      customProperties: customProps
    }
  }
}
export async function getRepo (repoName: string): Promise<Repo> {
  const parser = async (response: any): Promise<Repo[]> => {
    const repoParser = getRepoParser()
    return [(await repoParser(response.data))]
  }

  return (await getGithubData<Repo>(false, `repo: ${repoName}`, 'GET /repos/{owner}/{repo}', { owner: (await getEnv()).githubOrg, repo: repoName }, parser))[0]
}
export async function getRepos (): Promise<Repo[]> {
  const parser = async (response: any): Promise<Repo[]> => {
    const repos: Repo[] = []
    for (const repo of response.data) {
      const repoParser = getRepoParser()
      repos.push(await repoParser(repo))
    }
    return repos
  }

  return await getGithubData<Repo>(true, 'org repos', 'GET /orgs/{org}/repos', { org: (await getEnv()).githubOrg }, parser)
}

export async function getProtectionRules (repoName: string, branchName: string): Promise<BranchProtection> {
  const parser = async (response: any): Promise<BranchProtection[]> => {
    return [{
      requiredSignatures: response.data.required_signatures.enabled,
      enforceAdmins: response.data.enforce_admins.enabled,
      requireLinearHistory: response.data.required_linear_history.enabled,
      allowForcePushes: response.data.allow_force_pushes.enabled,
      allowDeletions: response.data.allow_deletions.enabled,
      blockCreations: response.data.block_creations.enabled,
      requiredConversationResolution: response.data.required_conversation_resolution.enabled,
      lockBranch: response.data.lock_branch.enabled,
      allowForkSyncing: response.data.allow_fork_syncing.enabled
    }]
  }

  return (await getGithubData<BranchProtection>(false, `branch protections for branch: ${branchName}, repo: ${repoName}`,
    'GET /repos/{owner}/{repo}/branches/{branch}/protection', { owner: (await getEnv()).githubOrg, repo: repoName, branch: branchName }, parser))[0]
}

function getBranchParser (repo: Repo): (branch: any) => Promise<Branch> {
  return async (branch: any): Promise<Branch> => {
    const isDependabot: boolean = branch.name.startsWith('dependabot')
    let protections: BranchProtection | null = null
    if ((branch.protected as boolean) && (branch.protection != null && (branch.protection.enabled as boolean))) {
      protections = await getProtectionRules(repo.name, branch.name)
    }

    return {
      name: branch.name,
      lastCommit: await getCommit(repo.name, branch.commit.sha),
      dependabot: isDependabot,
      deps: [],
      fileCount: 0,
      fileTypes: {},
      branchProtections: {
        protected: protections != null,
        protections: protections ?? undefined
      },
      actionRuns: [],
      deployedBranch: false,
      defaultBranch: repo.defaultBranch === branch.name,
      staleBranch: false,
      reportResults: {
        lowNodeVersion: '??',
        highNodeVersion: '??',
        lowTerraformVersion: '??',
        highTerraformVersion: '??',
        lowPythonVersion: '??',
        highPythonVersion: '??'
      }
    }
  }
}
export async function getBranch (repo: Repo, branchName: string): Promise<Branch> {
  const parser = async (response: any): Promise<Branch[]> => {
    const branchParser = getBranchParser(repo)
    return [(await branchParser(response.data))]
  }

  return (await getGithubData<Branch>(false, `branch ${branchName} for repo ${repo.name}`, 'GET /repos/{owner}/{repo}/branches/{branch}',
    { owner: (await getEnv()).githubOrg, repo: repo.name, branch: branchName }, parser))[0]
}
export async function getBranches (repo: Repo): Promise<Branch[]> {
  const parser = async (response: any): Promise<Branch[]> => {
    const branches: Branch[] = []
    for (const branch of response.data) {
      const branchParser = getBranchParser(repo)
      branches.push(await branchParser(branch))
    }
    return branches
  }

  return await getGithubData<Branch>(true, `branches for repo ${repo.name}`, 'GET /repos/{owner}/{repo}/branches',
    { owner: (await getEnv()).githubOrg, repo: repo.name }, parser)
}

function getCommitParser (): (commit: any) => Promise<Commit> {
  return async (commit: any): Promise<Commit> => {
    return {
      author: commit.commit.author.name ?? defaultCommit.author,
      date: commit.commit.author.date ?? defaultCommit.date,
      message: commit.commit?.message ?? defaultCommit.message,
      sha: commit.sha
    }
  }
}
async function getCommit (repoName: string, sha: string): Promise<Commit> {
  const parser = async (response: any): Promise<Commit[]> => {
    const commitParser = getCommitParser()
    return [(await commitParser(response.data))]
  }
  return (await getGithubData<Commit>(false, `last commit info for repo: ${repoName}, Commit sha: ${sha}`,
    'GET /repos/{owner}/{repo}/commits/{ref}', { owner: (await getEnv()).githubOrg, repo: repoName, ref: sha }, parser))[0]
}
export async function getCommits (repoName: string): Promise<Commit[]> {
  const parser = async (response: any): Promise<Commit[]> => {
    const commits: Commit[] = []
    for (const commit of response.data) {
      const commitParser = getCommitParser()
      commits.push(await commitParser(commit))
    }
    return commits
  }

  return await getGithubData<Commit>(false, `commits for repo: ${repoName}`,
    'GET /repos/{owner}/{repo}/commits', { owner: (await getEnv()).githubOrg, repo: repoName }, parser)
}

export async function getBranchLastCommit (repo: Repo, branchName: string): Promise<Commit> {
  const branch = await getBranch(repo, branchName)
  return await getCommit(repo.name, branch.lastCommit.sha)
}

export async function getRepoAdminTeams (repoName: string): Promise<string[]> {
  const parser = async (response: any): Promise<string[]> => {
    const adminTeams = []
    for (const team of response.data) {
      if (team.permission === 'admin') {
        adminTeams.push(team.name)
      }
    }
    return adminTeams
  }

  return await getGithubData<string>(true, `admin teams for repo: ${repoName}`, 'GET /repos/{owner}/{repo}/teams',
    { owner: (await getEnv()).githubOrg, repo: repoName }, parser)
}

export async function getOpenOrgSecretScanAlerts (): Promise<SecretScanAlert[]> {
  const parser = async (response: any): Promise<SecretScanAlert[]> => {
    const alerts: SecretScanAlert[] = []
    for (const alert of response.data) {
      alerts.push({
        secretType: alert.secret_type,
        createdAt: alert.created_at,
        locations: await getSecretAlertLocation(alert.repository.name, alert.number),
        state: alert.state,
        repoName: alert.repository.name
      })
    }
    return alerts
  }

  return await getGithubData<SecretScanAlert>(true, 'org secret scan alerts', 'GET /orgs/{org}/secret-scanning/alerts',
    { org: (await getEnv()).githubOrg, state: 'open' }, parser)
}

export async function getOpenOrgDependabotScanAlerts (): Promise<DependabotAlert[]> {
  const parser = async (response: any): Promise<DependabotAlert[]> => {
    const alerts: DependabotAlert[] = []
    for (const alert of response.data) {
      alerts.push({
        dependencyName: alert.dependency?.package?.name,
        createdAt: alert.created_at,
        dependencyEcosystem: alert.dependency?.package?.ecosystem,
        summary: alert.security_advisory?.summary,
        description: alert.security_advisory?.description,
        severity: alert.security_vulnerability?.severity ?? 'none',
        state: alert.state,
        repoName: alert.repository.name
      })
    }
    return alerts
  }

  return await getGithubData<DependabotAlert>(true, 'org secret scan alerts', 'GET /orgs/{org}/dependabot/alerts',
    { org: (await getEnv()).githubOrg, state: 'open' }, parser)
}

export async function getOpenOrgCodeScanAlerts (): Promise<CodeScanAlert[]> {
  const parser = async (response: any): Promise<CodeScanAlert[]> => {
    const alerts: CodeScanAlert[] = []
    for (const alert of response.data) {
      alerts.push({
        rule: {
          id: alert.rule.id,
          severity: alert.rule.severity,
          description: alert.rule.description,
          tags: alert.rule.tags,
          securitySeverityLevel: alert.rule.security_severity_level ?? 'none'
        },
        tool: {
          name: alert.tool.name,
          version: alert.tool.version
        },
        mostRecentInstance: {
          ref: alert.most_recent_instance.ref,
          environment: alert.most_recent_instance.environment,
          category: alert.most_recent_instance.category,
          commitSha: alert.most_recent_instance.commit_sha,
          message: alert.most_recent_instance.message.text,
          locationPath: alert.most_recent_instance.location.path
        },
        state: alert.state,
        location: alert.most_recent_instance.location.path,
        repoName: alert.repository.name,
        createdAt: alert.created_at
      })
    }
    return alerts
  }

  return await getGithubData<CodeScanAlert>(true, 'org code scan alerts', 'GET /orgs/{org}/code-scanning/alerts',
    { org: (await getEnv()).githubOrg, state: 'open' }, parser)
}

export async function getSecretAlertLocation (repoName: string, alertNumber: number): Promise<SecretAlertLocation[]> {
  const parser = async (response: any): Promise<SecretAlertLocation[]> => {
    const locations: SecretAlertLocation[] = []
    for (const location of response.data) {
      locations.push({
        type: location.type,
        locationPath: location.details?.path ?? null,
        locationUrl: location.details[`${(location.type as string)}_url`]
      })
    }
    return locations
  }

  return await getGithubData<SecretAlertLocation>(true, `secret-scanning alert locations for repo: ${repoName}`, 'GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}/locations',
    { owner: (await getEnv()).githubOrg, repo: repoName, alert_number: alertNumber }, parser)
}

export async function downloadRepoToMemory (repoName: string, branchName: string): Promise<JSZip> {
  const parser = async (response: any): Promise<JSZip[]> => {
    return [await loadAsync(response.data)]
  }
  return (await getGithubData<JSZip>(false, `zipball archive for repo: ${repoName}, branch: ${branchName}`,
    'GET /repos/{owner}/{repo}/zipball/{ref}', { owner: (await getEnv()).githubOrg, repo: repoName, ref: branchName }, parser))[0]
}

export async function getRepoAdmins (repoName: string): Promise<string[]> {
  const parser = async (response: any): Promise<string[]> => {
    return response.data.map((admin: any) => admin.login)
  }

  return await getGithubData<string>(true, `admins for repo: ${repoName}`, 'GET /repos/{owner}/{repo}/collaborators',
    { owner: (await getEnv()).githubOrg, repo: repoName, permission: 'admin', affiliation: 'direct' }, parser)
}

async function getRepoCustomProperties (repoName: string): Promise<RepoCustomProperty[]> {
  const parser = async (response: any): Promise<RepoCustomProperty[]> => {
    const props: RepoCustomProperty[] = []
    for (const prop of response.data) {
      if (typeof prop.value === 'string') {
        props.push({
          propertyName: prop.property_name,
          value: [prop.value]
        })
      } else if (Array.isArray(prop.value)) {
        props.push({
          propertyName: prop.property_name,
          value: prop.value
        })
      }
    }
    return props
  }

  return await getGithubData<RepoCustomProperty>(false, `repo custom props for repo: ${repoName}`, 'GET /repos/{owner}/{repo}/properties/values', { owner: (await getEnv()).githubOrg, repo: repoName }, parser)
}

// this function only gets the last 100 GHA
export async function getRepoGithubActionRuns (repoName: string): Promise<GithubActionRun[]> {
  const parser = async (response: any): Promise<GithubActionRun[]> => {
    const runs = []
    for (const run of response.data.workflow_runs) {
      runs.push({
        id: run.id ?? '',
        status: run.status ?? '',
        conclusion: run.conclusion ?? '',
        created_at: run.created_at ?? '',
        updated_at: run.updated_at ?? '',
        branch: run.head_branch
      })
    }
    return runs
  }
  return await getGithubData<GithubActionRun>(false, `github action runs for repo: ${repoName}`, 'GET /repos/{owner}/{repo}/actions/runs',
    { owner: (await getEnv()).githubOrg, repo: repoName, per_page: 100 }, parser, 'workflow_runs')
}

export async function getRepoOpenIssues (repoName: string): Promise<Issue[]> {
  const parser = async (response: any): Promise<Issue[]> => {
    const issues: Issue[] = []
    for (const issue of response.data) {
      issues.push({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        user: {
          login: issue.user?.login ?? ''
        },
        created_at: issue.created_at,
        updated_at: issue.updated_at
      })
    }
    return issues
  }

  return await getGithubData<Issue>(true, `issues for repo: ${repoName}`, '/repos/{owner}/{repo}/issues',
    { owner: (await getEnv()).githubOrg, repo: repoName, state: 'open' }, parser)
}

export async function getRepoOpenPRs (repoName: string): Promise<PullRequest[]> {
  const parser = async (response: any): Promise<PullRequest[]> => {
    const pulls: PullRequest[] = []
    for (const pull of response.data) {
      pulls.push({
        number: pull.number,
        title: pull.title,
        state: pull.state,
        user: {
          login: pull.user?.login ?? ''
        },
        created_at: pull.created_at,
        updated_at: pull.updated_at,
        dependabot: pull.user?.login === 'dependabot[bot]'
      })
    }
    return pulls
  }

  return await getGithubData<PullRequest>(true, `pull requests for repo: ${repoName}`, 'GET /repos/{owner}/{repo}/pulls',
    { owner: (await getEnv()).githubOrg, repo: repoName, state: 'open' }, parser)
}

export async function searchOrganizationForStrings (searchTerms: string[]): Promise<Array<Record<string, any>>> {
  const parser = async (response: any): Promise<Array<Record<string, any>>> => {
    return response.data.items
  }

  const reposWithTerms: Array<Record<string, any>> = []
  const org = (await getEnv()).githubOrg

  for (const term of searchTerms) {
    reposWithTerms.push(...await getGithubData<Record<string, any>>(true, `search strings: ${term}`, 'GET /search/code', { q: `${term}+org:${org}` }, parser, 'items'))
  }
  return reposWithTerms
}

export async function getOrg (orgTeamNames: string[], orgMemberNames: string[]): Promise<GithubOrganization> {
  const parser = async (response: any): Promise<GithubOrganization[]> => {
    return [{
      name: response.data.name,
      description: response.data.description,
      email: response.data.email,
      members: orgMemberNames,
      repoCount: response.data.public_repos,
      publicRepoCount: response.data.public_repos,
      createdDateTime: response.data.created_at,
      teams: orgTeamNames,
      type: response.data.type,
      privateRepoCount: response.data.total_private_repos,
      ownedPrivateRepoCount: response.data.owned_private_repos,
      diskUsage: response.data.disk_usage,
      billingEmail: response.data.billing_email,
      defaultRepoPermission: response.data.default_repository_permission,
      membersCanCreateRepos: response.data.members_can_create_repositories,
      twoFAEnabled: response.data.two_factor_requirement_enabled,
      membersAllowedRepositoryCreationType: response.data.members_allowed_repository_creation_type,
      membersCanCreatePublicRepositories: response.data.members_can_create_public_repositories,
      membersCanCreatePrivateRepositories: response.data.members_can_create_private_repositories,
      membersCanCreateInternalRepositories: response.data.members_can_create_internal_repositories,
      membersCanCreatePages: response.data.members_can_create_pages,
      membersCanForkPrivateRepositories: response.data.members_can_fork_private_repositories,
      webCommitSignoffRequired: response.data.web_commit_signoff_required,
      membersCanCreatePublicPages: response.data.members_can_create_public_pages,
      membersCanCreatePrivatePages: response.data.members_can_create_private_pages,
      planName: response.data.plan?.name,
      planSpace: response.data.plan?.space,
      planPrivateRepos: response.data.plan?.private_repos,
      planFilledSeats: response.data.plan?.filled_seats,
      planSeats: response.data.plan?.seats,
      advancedSecurityEnabledForNewRepositories: response.data.advanced_security_enabled_for_new_repositories,
      dependabotAlertsEnabledForNewRepositories: response.data.dependabot_alerts_enabled_for_new_repositories,
      dependabotSecurityUpdatesEnabledForNewRepositories: response.data.dependabot_security_updates_enabled_for_new_repositories,
      dependencyGraphEnabledForNewRepositories: response.data.dependency_graph_enabled_for_new_repositories,
      secretScanningEnabledForNewRepositories: response.data.secret_scanning_enabled_for_new_repositories,
      secretScanningPushProtectionEnabledForNewRepositories: response.data.secret_scanning_push_protection_enabled_for_new_repositories,
      secretScanningPushProtectionCustomLinkEnabled: response.data.secret_scanning_push_protection_custom_link_enabled,
      secretScanningPushProtectionCustomLink: response.data.secret_scanning_push_protection_custom_link,
      secretScanningValidityChecksEnabled: response.data.secret_scanning_validity_checks_enabled
    }]
  }

  return (await getGithubData<GithubOrganization>(false, 'github orginization', 'GET /orgs/{org}', { org: (await getEnv()).githubOrg }, parser))[0]
}

export async function getOrgMembers (): Promise<GithubMember[]> {
  const parser = async (response: any): Promise<GithubMember[]> =>
    response.data.map((member: any) => ({
      name: member.login,
      type: member.type
    }))
  return await getGithubData<GithubMember>(true, 'organization members', 'GET /orgs/{org}/members', { org: (await getEnv()).githubOrg }, parser)
}

export async function getOrgTeams (): Promise<GithubTeam[]> {
  const parser = async (response: any): Promise<GithubTeam[]> => {
    const teams: GithubTeam[] = []
    for (const team of response.data) {
      const teamData = {
        name: team.name,
        slug: team.slug,
        description: team.description,
        notificationSetting: team.notification_setting,
        privacy: team.privacy,
        permission: team.permission,
        members: await getTeamMembers(team.slug),
        repos: await getTeamRepos(team.slug)
      }

      teams.push(teamData)
    }
    return teams
  }

  return await getGithubData<GithubTeam>(true, 'organization teams', 'GET /orgs/{org}/teams', { org: (await getEnv()).githubOrg }, parser)
}

async function getTeamMembers (teamSlug: string): Promise<string[]> {
  const parser = async (response: any): Promise<string[]> => response.data.map((member: any) => member.login)
  return await getGithubData<string>(true, 'team members', 'GET /orgs/{org}/teams/{team_slug}/members', { org: (await getEnv()).githubOrg, team_slug: teamSlug }, parser)
}

async function getTeamRepos (teamSlug: string): Promise<string[]> {
  const parser = async (response: any): Promise<string[]> => response.data.map((repo: any) => repo.name)
  return await getGithubData<string>(true, 'team repos', 'GET /orgs/{org}/teams/{team_slug}/repos', { org: (await getEnv()).githubOrg, team_slug: teamSlug }, parser)
}

export const apiCallCounter: Record<string, number> = {}

function incrementApiCallCounter (route: string): void {
  if (apiCallCounter[route] == null) {
    apiCallCounter[route] = 0
  } else {
    apiCallCounter[route] += 1
  }
}

async function getGithubData<T> (
  usePaging: boolean,
  itemsDescription: string,
  route: string,
  octokitOptions: OctokitOptions,
  parser: (response: any) => Promise<T[]>,
  responseProperty: string | null = null
): Promise<T[]> {
  try {
    incrementApiCallCounter(route)
    const octokit = await getOctokit()
    const data: T[] = []
    let page = 1
    octokitOptions.per_page = octokitOptions.per_page == null && usePaging ? 100 : octokitOptions.per_page // if not passed in and we are paging, default to 100
    let response
    while (true) {
      response = await octokit.request(route, { ...octokitOptions, ...{ page } })
      data.push(...(await parser(response)))

      const responseData = responseProperty != null ? response.data[responseProperty] : response.data
      if (responseData.length === 0 || !usePaging) {
        break
      }
      page++
    }

    return data
  } catch (error) {
    logger.error(`Error getting ${itemsDescription}: ${(error as Error).message}`)
    return []
  }
}
