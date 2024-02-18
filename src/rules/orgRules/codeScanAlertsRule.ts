import { errorHandler, getOrgCodeScanAlerts } from '../../util'
import type { CacheFile } from '../../types'
import { OrgWideRule } from '../rule'

export class CodeScanAlertsRule extends OrgWideRule {
  async run (cacheFile: CacheFile): Promise<void> {
    try {
      const alerts = (await getOrgCodeScanAlerts()).filter(alert => alert.state === 'open')

      const repos = cacheFile.info
      for (const alert of alerts) {
        if (repos[alert.repoName] != null) {
          const securitySeverity = alert.rule.securitySeverityLevel
          repos[alert.repoName].codeScanAlerts[securitySeverity].push(alert)
        }
      }
    } catch (error) {
      errorHandler(error, CodeScanAlertsRule.name)
    }
  }
}
