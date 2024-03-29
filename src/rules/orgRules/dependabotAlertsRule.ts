import { errorHandler, getOpenOrgDependabotScanAlerts } from '../../util'
import type { Repo } from '../../types'
import { OrgRule } from '../rule'

export class DependabotAlertsRule extends OrgRule {
  async run (repos: Record<string, Repo>): Promise<void> {
    try {
      const alerts = await getOpenOrgDependabotScanAlerts()
      for (const alert of alerts) {
        if (repos[alert.repoName] != null) {
          const securitySeverity = alert.severity
          repos[alert.repoName].dependabotScanAlerts[securitySeverity].push(alert)
        }
      }
    } catch (error) {
      errorHandler(error, DependabotAlertsRule.name)
    }
  }
}
