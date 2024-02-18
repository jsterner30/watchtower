import { errorHandler, getOrgSecretScanAlerts } from '../../util'
import type { CacheFile } from '../../types'
import { OrgWideRule } from '../rule'

export class SecretScanAlertsRule extends OrgWideRule {
  async run (cacheFile: CacheFile): Promise<void> {
    try {
      const alerts = (await getOrgSecretScanAlerts()).filter(alert => alert.state === 'open')

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
