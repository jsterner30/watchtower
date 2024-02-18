import { errorHandler, getOrgDependabotScanAlerts } from '../../util'
import type { CacheFile } from '../../types'
import { OrgWideRule } from '../rule'

export class DependabotAlertsRule extends OrgWideRule {
  async run (cacheFile: CacheFile): Promise<void> {
    try {
      const alerts = (await getOrgDependabotScanAlerts()).filter(alert => alert.state === 'open')
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
