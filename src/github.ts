import {
  readJsonFromFile,
  writeJsonToFile,
  getEnv,
  ProgressBarManager, deleteDirectory, createDataDirectoriesIfNonexistent, getOverallGPAScore
} from './util'
import { logger } from './util/logger'
import { Octokit } from '@octokit/rest'
import { RequestError } from '@octokit/request-error'
import JSZip, { loadAsync } from 'jszip'
import {
  fileCountRule,
  dockerfileRule,
  packageJsonRule,
  gitignoreRule,
  dotGithubDirRule,
  dockerComposeRule,
  packageLockRule,
  terraformRule
} from './branchRules'
import {
  latestCommitRule,
  adminsRule,
  teamsRule,
  openPullRequestsRule,
  openIssueRule,
  githubActionRunRule
} from './repoRules'
import type { CacheFile, RepoInfo, Commit, BranchProtection } from './types'
import { promises as fs } from 'node:fs'
import * as path from 'path'
import { GradeEnum, validRepoInfo } from './types'
import {
  deployedBranchRule,
  staleBranchRule
} from './secondaryBranchRules'
import {
  nodeVersionReport,
  terraformVersionReport,
  terraformModuleReport,
  dockerfileImageReport,
  ghActionModuleReport,
  teamlessRepoReport,
  dependabotBranchReport,
  staleBranchReport,
  lowFilesReport,
  reposWithoutNewCommitsReport,
  publicAndInternalReport,
  npmDependencyReport,
  codeScanAlertReport,
  dependabotAlertReport,
  secretScanAlertReport,
  devPrdBranchesReport
} from './reports'
import ReportDataWriter from './util/reportDataWriter'
import {
  codeScanAlertReportGradeName, dependabotAlertReportGradeName,
  dependabotBranchReportGradeName, dockerfileImageReportGradeName, ghActionModuleReportGradeName,
  nodeVersionReportGradeName, npmDependencyReportGradeName,
  publicAndInternalReportGradeName,
  reposWithoutNewCommitsReportGradeName, secretAlertReportGradeName,
  staleBranchReportGradeName, teamlessRepoReportGradeName, terraformModuleReportGradeName,
  terraformVersionReportGradeName
} from './util/constants'
import { codeScanAlertsRule, dependabotAlertsRule, secretScanAlertsRule } from './orgRules'

export async function getAllReposInOrg (orgName: string, octokit: Octokit): Promise<CacheFile> {
  const readFromAllReposFile = true
  let allReposWithMeta: CacheFile = await readJsonFromFile(path.resolve('./data/allRepos.json')) as CacheFile
  if (allReposWithMeta == null || (Object.keys(allReposWithMeta.info)).length === 0 || !readFromAllReposFile) {
    logger.info('Getting all repos in org and writing them to allRepos.json file')
    const allRepos: Record<string, any> = {}
    try {
      let page = 1

      while (true) {
        const { data: repos } = await octokit.repos.listForOrg({
          org: orgName,
          per_page: 100, // Fetch 100 repositories per page (adjust as needed)
          page
        })

        if (repos.length === 0) {
          break // No more repositories to fetch
        }

        for (const repo of repos) {
          allRepos[repo.name] = repo
        }
        page++
      }

      const repoInfoObj: Record<string, RepoInfo> = {}
      for (const repoName in allRepos) {
        repoInfoObj[repoName] = createRepoInfo(allRepos[repoName])
      }

      allReposWithMeta = {
        metadata: {
          repoCount: Object.keys(allRepos).length,
          branchCount: 0,
          lastRunDate: new Date().toISOString()
        },
        info: repoInfoObj
      }

      await writeJsonToFile(allReposWithMeta, path.resolve('./data/allRepos.json'))
    } catch (error) {
      console.error('Error occurred while fetching repositories:', error)
      throw error // Optionally rethrow the error for handling at a higher level
    }
  }
  return allReposWithMeta
}

function createRepoInfo (rawRepo: Record<string, any>): RepoInfo {
  return {
    name: rawRepo.name,
    private: rawRepo.private,
    url: rawRepo.url,
    description: rawRepo.description ?? '',
    language: rawRepo.language ?? '',
    allowForking: rawRepo.allow_forking,
    visibility: rawRepo.visibility,
    forksCount: rawRepo.forks_count,
    archived: rawRepo.archived,
    defaultBranch: rawRepo.default_branch,
    branches: {},
    lastCommit: {
      author: '',
      date: ''
    },
    openPullRequests: [],
    openIssues: [],
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
      critical: []
    },
    teams: [],
    admins: [],
    healthScores: {}
  }
}

export async function downloadReposAndApplyRules (reposWithBranchesFile: CacheFile, octokit: Octokit, lastRunDate: string): Promise<void> {
  const reposWithBranches = reposWithBranchesFile.info
  const repoNames = Object.keys(reposWithBranches)

  const totalOperations = parseInt(reposWithBranchesFile.metadata.repoCount)
  const progress = new ProgressBarManager(totalOperations, 'Running rules on', [{ displayName: 'Current Repo', token: 'currentRepo' }])
  progress.start()

  for (const repoName of repoNames) {
    progress.update([{ displayName: 'Current Repo', token: 'currentRepo', value: repoName }])
    const repo = reposWithBranches[repoName]
    await latestCommitRule(octokit, repo)

    if (repo.lastCommit.date > lastRunDate) {
      await runRepoRules(octokit, repo)
      for (const branchName of Object.keys(repo.branches)) {
        if (!repo.branches[branchName].dependabot) {
          repo.branches[branchName].lastCommit = await getBranchCommitInfo(octokit, repoName, branchName)
          if (repo.branches[branchName].lastCommit.date > lastRunDate) {
            const downloaded = await downloadRepoToMemory(octokit, repoName, branchName)
            if (downloaded != null) {
              for (const fileName of Object.keys(downloaded.files)) {
                if (!downloaded.files[fileName].dir) {
                  await runBranchRules(octokit, repo, downloaded, branchName, fileName)
                }
              }
              // these are rules that rely on the initial branch rules
              await runSecondaryBranchRules(repo, branchName)
            }
          }
        }
      }
      await writeJsonToFile(repo, `./data/repoInfo/${repoName}.json`)
    }
  }
}

async function runBranchRules (octokit: Octokit, repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
  await dockerfileRule(octokit, repo, downloaded, branchName, fileName)
  await packageJsonRule(octokit, repo, downloaded, branchName, fileName)
  await dotGithubDirRule(octokit, repo, downloaded, branchName, fileName)
  await gitignoreRule(octokit, repo, downloaded, branchName, fileName)
  await dockerComposeRule(octokit, repo, downloaded, branchName, fileName)
  await packageLockRule(octokit, repo, downloaded, branchName, fileName)
  await terraformRule(octokit, repo, downloaded, branchName, fileName)
  await fileCountRule(octokit, repo, downloaded, branchName, fileName)
}

async function runSecondaryBranchRules (repo: RepoInfo, branchName: string): Promise<void> {
  await deployedBranchRule(repo, branchName)
  await staleBranchRule(repo, branchName)
}

async function runRepoRules (octokit: Octokit, repo: RepoInfo): Promise<void> {
  await adminsRule(octokit, repo)
  await teamsRule(octokit, repo)
  await openPullRequestsRule(octokit, repo)
  await openIssueRule(octokit, repo)
  await githubActionRunRule(octokit, repo)
}

export async function runReports (): Promise<void> {
  await deleteDirectory('./data/reports')
  await createDataDirectoriesIfNonexistent()

  const files = await fs.readdir('./data/repoInfo')
  const repos: RepoInfo[] = []

  for (const file of files) {
    const filePath = path.join('./data/repoInfo', file)
    const repoInfo = await readJsonFromFile(filePath)

    if (repoInfo != null && validRepoInfo.Check(repoInfo)) {
      repos.push(repoInfo)
    } else {
      logger.error(`Invalid repoInfo found in file: ${file}`)
    }
  }
  await teamlessRepoReport(repos)
  await nodeVersionReport(repos)
  await dependabotBranchReport(repos)
  await staleBranchReport(repos)
  await lowFilesReport(repos)
  await terraformVersionReport(repos)
  await reposWithoutNewCommitsReport(repos)
  await publicAndInternalReport(repos)
  await dockerfileImageReport(repos)
  await terraformModuleReport(repos)
  await ghActionModuleReport(repos)
  await npmDependencyReport(repos)
  await codeScanAlertReport(repos)
  await dependabotAlertReport(repos)
  await secretScanAlertReport(repos)
  await devPrdBranchesReport(repos)

  // this has to be run last
  await generateOverallReport(repos)
}

export async function getProtectionRules (octokit: Octokit, repoName: string, branchName: string): Promise<BranchProtection | null> {
  try {
    const owner = (await getEnv()).githubOrg
    const res = await octokit.request(`GET /repos/${owner}/${repoName}/branches/${branchName}/protection`, {
      owner,
      repo: repoName,
      branch: branchName
    })
    return {
      requiredSignatures: res.data.required_signatures.enabled,
      enforceAdmins: res.data.enforce_admins.enabled,
      requireLinearHistory: res.data.required_linear_history.enabled,
      allowForcePushes: res.data.allow_force_pushes.enabled,
      allowDeletions: res.data.allow_deletions.enabled,
      blockCreations: res.data.block_creations.enabled,
      requiredConversationResolution: res.data.required_conversation_resolution,
      lockBranch: res.data.lock_branch.enabled,
      allowForkSyncing: res.data.allow_fork_syncing.enabled
    }
  } catch (error) {
    if (error instanceof RequestError) {
      if (error.status !== 404) {
        logger.error(`Error getting branch protections for repo: ${repoName}: ${error.message}`)
      }
    } else {
      logger.error(`Error getting branch protections for repo: ${repoName}: ${error as string}`)
    }
    return null
  }
}

async function getBranchCommitInfo (octokit: Octokit, repoName: string, branchName: string): Promise<Commit> {
  try {
    const response = await octokit.repos.getBranch({
      owner: (await getEnv()).githubOrg,
      repo: repoName,
      branch: branchName
    })

    const commitSha = response.data.commit.sha

    const commitResponse = await octokit.repos.getCommit({
      owner: (await getEnv()).githubOrg,
      repo: repoName,
      ref: commitSha
    })

    const commit = commitResponse.data.commit
    const author = commit.author

    if (author != null) {
      return {
        author: author.name ?? '',
        date: author.date ?? ''
      }
    } else {
      return {
        author: '',
        date: ''
      }
    }
  } catch (error) {
    console.error(`Unable to get last commit info for repo: ${repoName}, Branch: ${branchName}. Error: ${error as string}`)
    return {
      author: '',
      date: ''
    }
  }
}

export async function getBranches (octokit: Octokit, repos: RepoInfo[]): Promise<CacheFile> {
  const readFromFile = true
  let filteredWithBranchesWithMeta: CacheFile = await readJsonFromFile('./data/filteredWithBranches.json') as CacheFile

  if (filteredWithBranchesWithMeta == null || (Object.keys(filteredWithBranchesWithMeta.info)).length === 0 || !readFromFile) {
    logger.info('Getting all branches in org and writing them to filteredWithBranches.json file')
    const filteredWithBranches: Record<string, any> = {}
    const progress = new ProgressBarManager(repos.length, 'Getting branch info for repos', [{ displayName: 'Current Repo', token: 'currentRepo' }])
    progress.start()
    let branchCount = 0

    for (const repo of repos) {
      try {
        progress.update([{ displayName: 'Current Repo', token: 'currentRepo', value: repo.name }])

        let page = 1
        let branches: any[] = []

        while (true) {
          const response = await octokit.repos.listBranches({
            owner: (await getEnv()).githubOrg,
            repo: repo.name,
            per_page: 100,
            page
          })

          branches = [
            ...branches,
            ...response.data
          ]

          if (response.data.length < 100) {
            break
          }
          page++
        }

        branchCount += branches.length
        for (let i = 0; i < branches.length; ++i) {
          const protections = branches[i].name.startsWith('dependabot') as boolean ? await getProtectionRules(octokit, repo.name, branches[i].name) : null
          repo.branches[branches[i].name] = {
            name: branches[i].name,
            lastCommit: await getCommitInfo(octokit, repo.name, branches[i].commit.sha),
            dependabot: branches[i].name.startsWith('dependabot'),
            deps: [],
            fileCount: 0,
            branchProtections: {
              protected: protections != null,
              protections: protections == null ? undefined : protections
            },
            actionRuns: [],
            deployedBranch: false,
            defaultBranch: repo.defaultBranch === branches[i].name,
            staleBranch: false
          }
        }
      } catch (error) {
        logger.error(`Error downloading getting branch info for ${repo.name}: ${error as string}`)
      }
      filteredWithBranches[repo.name] = repo
    }

    filteredWithBranchesWithMeta = {
      metadata: {
        repoCount: repos.length,
        branchCount,
        lastRunDate: new Date().toISOString()
      },
      info: filteredWithBranches
    }

    await writeJsonToFile(filteredWithBranchesWithMeta, './data/filteredWithBranches.json')
  }
  return filteredWithBranchesWithMeta
}

async function getCommitInfo (octokit: Octokit, repoName: string, sha: string): Promise<Commit> {
  try {
    const response = await octokit.repos.getCommit({
      owner: (await getEnv()).githubOrg,
      repo: repoName,
      ref: sha
    })

    const commit = response.data.commit
    const author = commit.author

    if (author != null) {
      return {
        author: author.name ?? '',
        date: author.date ?? ''
      }
    } else {
      return {
        author: '',
        date: ''
      }
    }
  } catch (error) {
    logger.error(`Unable to get last commit info for repo: ${repoName}, Commit sha: ${sha}. Error: ${error as string}`)
    return {
      author: '',
      date: ''
    }
  }
}

export async function filterArchived (allReposFile: CacheFile): Promise<RepoInfo[]> {
  const filteredRepos: RepoInfo[] = []
  for (const repoName of Object.keys(allReposFile.info)) {
    const repo = allReposFile.info[repoName]
    if (!repo.archived) {
      filteredRepos.push(repo)
    }
  }
  return filteredRepos
}

async function downloadRepoToMemory (octokit: Octokit, repoName: string, branchName: string): Promise<JSZip | null> {
  try {
    // Get the tarball URL for the specified branch
    const { data } = await octokit.repos.downloadZipballArchive({
      owner: (await getEnv()).githubOrg,
      repo: repoName,
      ref: branchName
    })

    return await loadAsync(data as any)
  } catch (error) {
    logger.error('Error:', error)
    return null
  }
}

export async function searchOrganizationForStrings (octokit: Octokit, searchTerms: string[]): Promise<void> {
  const org = (await getEnv()).githubOrg
  const reposWithTerms: Array<Record<string, any>> = []

  try {
    for (const term of searchTerms) {
      let termSubArray: Array<Record<string, any>> = []

      let page = 1
      while (true) {
        const { data } = await octokit.request('GET /search/code', {
          q: `${term}+org:${org}`,
          per_page: 100,
          page
        })

        const items = data.items
        if (items.length === 0) {
          break // No more repositories to fetch
        }

        termSubArray = [
          ...termSubArray,
          ...items
        ]

        page++
      }
      reposWithTerms.push(termSubArray)
    }
    console.log(reposWithTerms)
    await writeJsonToFile(reposWithTerms, './data/personsRepos.json')
  } catch (error) {
    console.error('Error occurred:', error)
  }
}

export async function generateOverallReport (repos: RepoInfo[]): Promise<void> {
  const header = [
    { id: 'repoName', title: 'Repo' },
    { id: 'overallScore', title: 'Overall Score/Grade' },
    { id: 'teams', title: 'Admin Teams' },
    { id: 'lastCommitDate', title: 'Last Commit Date' },
    { id: 'lastCommitAuthor', title: 'Last Commit User' },
    { id: dependabotBranchReportGradeName, title: 'Dependabot Branch Report Grade' },
    { id: nodeVersionReportGradeName, title: 'Node Version Report Grade' },
    { id: terraformVersionReportGradeName, title: 'Terraform Version Report Grade' },
    { id: staleBranchReportGradeName, title: 'Stale Branch Report Grade' },
    { id: reposWithoutNewCommitsReportGradeName, title: 'Newest Commit Report Grade' },
    { id: publicAndInternalReportGradeName, title: 'Public and Internal Report Grade' },
    { id: teamlessRepoReportGradeName, title: 'Teamless Repo Report Grade' },
    { id: dockerfileImageReportGradeName, title: 'Dockerfile Image Report Grade' },
    { id: ghActionModuleReportGradeName, title: 'GH Action Module Report Grade' },
    { id: npmDependencyReportGradeName, title: 'NPM Dependency Report Grade' },
    { id: terraformModuleReportGradeName, title: 'Terraform Module Report Grade' },
    { id: codeScanAlertReportGradeName, title: 'Code Scan Alert Report Grade' },
    { id: dependabotAlertReportGradeName, title: 'Dependabot Scan Alert Report Grade' },
    { id: secretAlertReportGradeName, title: 'Secret Scan Alert Report Grade' }
  ]

  const overallHealthReportWriter = new ReportDataWriter('./data/overallHealthReport.csv', header)

  for (const repo of repos) {
    const overallScore = getOverallGPAScore(repo.healthScores)
    overallHealthReportWriter.data.push({
      repoName: repo.name,
      overallScore,
      teams: repo.teams,
      lastCommitDate: repo.lastCommit.date,
      lastCommitAuthor: repo.lastCommit.author,
      [dependabotBranchReportGradeName]: repo.healthScores[dependabotBranchReportGradeName] != null ? repo.healthScores[dependabotBranchReportGradeName].grade : GradeEnum.NotApplicable,
      [nodeVersionReportGradeName]: repo.healthScores[nodeVersionReportGradeName] != null ? repo.healthScores[nodeVersionReportGradeName].grade : GradeEnum.NotApplicable,
      [terraformVersionReportGradeName]: repo.healthScores[terraformVersionReportGradeName] != null ? repo.healthScores[terraformVersionReportGradeName].grade : GradeEnum.NotApplicable,
      [staleBranchReportGradeName]: repo.healthScores[staleBranchReportGradeName] != null ? repo.healthScores[staleBranchReportGradeName].grade : GradeEnum.NotApplicable,
      [reposWithoutNewCommitsReportGradeName]: repo.healthScores[reposWithoutNewCommitsReportGradeName] != null ? repo.healthScores[reposWithoutNewCommitsReportGradeName].grade : GradeEnum.NotApplicable,
      [publicAndInternalReportGradeName]: repo.healthScores[publicAndInternalReportGradeName] != null ? repo.healthScores[publicAndInternalReportGradeName].grade : GradeEnum.NotApplicable,
      [teamlessRepoReportGradeName]: repo.healthScores[teamlessRepoReportGradeName] != null ? repo.healthScores[teamlessRepoReportGradeName].grade : GradeEnum.NotApplicable,
      [dockerfileImageReportGradeName]: repo.healthScores[dockerfileImageReportGradeName] != null ? repo.healthScores[dockerfileImageReportGradeName].grade : GradeEnum.NotApplicable,
      [ghActionModuleReportGradeName]: repo.healthScores[ghActionModuleReportGradeName] != null ? repo.healthScores[ghActionModuleReportGradeName].grade : GradeEnum.NotApplicable,
      [npmDependencyReportGradeName]: repo.healthScores[npmDependencyReportGradeName] != null ? repo.healthScores[npmDependencyReportGradeName].grade : GradeEnum.NotApplicable,
      [terraformModuleReportGradeName]: repo.healthScores[terraformModuleReportGradeName] != null ? repo.healthScores[terraformModuleReportGradeName].grade : GradeEnum.NotApplicable,
      [codeScanAlertReportGradeName]: repo.healthScores[codeScanAlertReportGradeName] != null ? repo.healthScores[codeScanAlertReportGradeName].grade : GradeEnum.NotApplicable,
      [dependabotAlertReportGradeName]: repo.healthScores[dependabotBranchReportGradeName] != null ? repo.healthScores[dependabotAlertReportGradeName].grade : GradeEnum.NotApplicable,
      [secretAlertReportGradeName]: repo.healthScores[secretAlertReportGradeName] != null ? repo.healthScores[secretAlertReportGradeName].grade : GradeEnum.NotApplicable
    })
  }

  await overallHealthReportWriter.write()
}

export async function runOrgRules (octokit: Octokit, cacheFile: CacheFile): Promise<void> {
  await codeScanAlertsRule(octokit, cacheFile)
  await dependabotAlertsRule(octokit, cacheFile)
  await secretScanAlertsRule(octokit, cacheFile)
}
