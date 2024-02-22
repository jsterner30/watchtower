import { errorHandler, getOpenOrgCodeScanAlerts } from '../../util'
import type { CacheFile } from '../../types'
import { OrgRule } from '../rule'

export class CodeScanAlertsRule extends OrgRule {
  async run (cacheFile: CacheFile): Promise<void> {
    try {
      const alerts = await getOpenOrgCodeScanAlerts()
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
