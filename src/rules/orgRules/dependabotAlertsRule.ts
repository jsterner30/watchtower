import { errorHandler, getEnv } from '../../util'
import type { CacheFile, DependabotScanAlertBySeverityLevel } from '../../types'
import { OrgRule } from '../rule'

export class DependabotAlertsRule extends OrgRule {
  async run (cacheFile: CacheFile): Promise<void> {
    try {
      let alerts: any = []
      let page = 1
      while (true) {
        const org = (await getEnv()).githubOrg
        const { data } = await this.octokit.request(`GET /orgs/${org}/dependabot/alerts`, {
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
          if (alert.repository?.name != null && repos[alert.repository.name] != null) {
            try {
              const securitySeverity = (alert.security_vulnerability?.severity ?? 'none') as keyof DependabotScanAlertBySeverityLevel

              repos[alert.repository.name].dependabotScanAlerts[securitySeverity].push({
                dependencyName: alert.dependency?.package?.name,
                dependencyEcosystem: alert.dependency?.package?.ecosystem,
                summary: alert.security_advisory?.summary,
                description: alert.security_advisory?.description,
                severity: alert.security_vulnerability?.severity ?? 'none'
              })
            } catch (error) {
              errorHandler(error, DependabotAlertsRule.name, alert.repository.name)
            }
          }
        }
      }
    } catch (error) {
      errorHandler(error, DependabotAlertsRule.name)
    }
  }
}