import { errorHandler, getEnv } from '../../util'
import type { CacheFile } from '../../types'
import { OrgRule } from '../rule'

export class SecretScanAlertsRule extends OrgRule {
  async run (cacheFile: CacheFile): Promise<void> {
    try {
      let alerts: any = []
      let page = 1
      while (true) {
        const org = (await getEnv()).githubOrg
        const { data } = await this.octokit.request(`GET /orgs/${org}/secret-scanning/alerts`, {
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
              repos[alert.repository.name].secretScanAlerts.critical.push({
                secretType: alert.secret_type,
                secret: alert.secret
              })
            } catch (error) {
              errorHandler(error, SecretScanAlertsRule.name, alert.repository.name)
            }
          }
        }
      }
    } catch (error) {
      errorHandler(error, SecretScanAlertsRule.name)
    }
  }
}
