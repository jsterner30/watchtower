import { Octokit } from '@octokit/rest'
import { errorHandler, getEnv } from '../util'
import type { CacheFile, OrgRule } from '../types'
import { SecretScanningAlertBySeverityLevel } from '../types'

export const secretScanningAlertsRule: OrgRule = async (octokit: Octokit, cacheFile: CacheFile): Promise<void> => {
  try {
    let alerts: any = []
    let page = 1
    while (true) {
      const org = (await getEnv()).githubOrg
      const { data } = await octokit.request(`GET /orgs/${org}/secret-scanning/alerts`, {
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
        const securitySeverity = (alert.security_vulneribility.severity ?? 'none') as keyof SecretScanningAlertBySeverityLevel

        repos[alert.repository.name].secretScanningAlerts[securitySeverity].push({
          secretType: alert.secret_type,
          secret: alert.secret
        })
      }
    }
  } catch (error) {
    errorHandler(error, secretScanningAlertsRule.name)
  }
}
