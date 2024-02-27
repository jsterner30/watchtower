import { errorHandler, getOpenOrgDependabotScanAlerts } from '../../util'
import type { CacheFile } from '../../types'
import { OrgRule } from '../rule'

export class DependabotAlertsRule extends OrgRule {
  async run (cacheFile: CacheFile): Promise<void> {
    try {
      const alerts = await getOpenOrgDependabotScanAlerts()
      const repos = cacheFile.info
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
