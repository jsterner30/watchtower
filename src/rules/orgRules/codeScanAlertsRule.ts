import { errorHandler, getOpenOrgCodeScanAlerts } from '../../util'
import { OrgRule } from '../rule'
import { Repo } from '../../types'

export class CodeScanAlertsRule extends OrgRule {
  async run (repos: Record<string, Repo>): Promise<void> {
    try {
      const alerts = await getOpenOrgCodeScanAlerts()
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
