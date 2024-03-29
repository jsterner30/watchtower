import { errorHandler, getOpenOrgSecretScanAlerts } from '../../util'
import { OrgRule } from '../rule'
import { Repo } from '../../types'

export class SecretScanAlertsRule extends OrgRule {
  async run (repos: Record<string, Repo>): Promise<void> {
    try {
      const alerts = await getOpenOrgSecretScanAlerts()
      for (const alert of alerts) {
        if (repos[alert.repoName] != null) {
          repos[alert.repoName].secretScanAlerts.critical.push(alert)
        }
      }
    } catch (error) {
      errorHandler(error, SecretScanAlertsRule.name)
    }
  }
}
