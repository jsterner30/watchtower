import { Octokit } from '@octokit/rest'
import { errorHandler, getEnv } from '../util'
import type { CacheFile, DependabotScanningAlertBySeverityLevel, OrgRule } from '../types'

export const dependabotAlertsRule: OrgRule = async (octokit: Octokit, cacheFile: CacheFile): Promise<void> => {
  try {
    let alerts: any = []
    let page = 1
    while (true) {
      const org = (await getEnv()).githubOrg
      const { data } = await octokit.request(`GET /orgs/${org}/dependabot/alerts`, {
        org,
        per_page: 100,
        page
      })

      alerts = [...alerts, ...data]
      if (data.length < 100) {
        break
      }
      page++
    }

    const repos = cacheFile.info
    for (const alert of alerts) {
      if (alert.state === 'open') {
        const securitySeverity = (alert.security_vulneribility.severity ?? 'none') as keyof DependabotScanningAlertBySeverityLevel

        repos[alert.repository.name].dependabotScanningAlerts[securitySeverity].push({
          dependencyName: alert.dependency.name,
          dependencyEcosystem: alert.dependency.ecosystem,
          summary: alert.security_advisory.summary,
          description: alert.security_advisory.description,
          severity: alert.security_vulneribility.severity ?? 'none'
        })
      }
    }
  } catch (error) {
    errorHandler(error, dependabotAlertsRule.name)
  }
}
