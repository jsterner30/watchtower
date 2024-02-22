import { errorHandler, getOpenOrgSecretScanAlerts } from '../../util'
import type { CacheFile } from '../../types'
import { OrgRule } from '../rule'

export class SecretScanAlertsRule extends OrgRule {
  async run (cacheFile: CacheFile): Promise<void> {
    try {
      const alerts = await getOpenOrgSecretScanAlerts()

      const repos = cacheFile.info
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
