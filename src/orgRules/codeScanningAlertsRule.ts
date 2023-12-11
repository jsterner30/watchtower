import { Octokit } from '@octokit/rest'
import { errorHandler, getEnv } from '../util'
import type { CacheFile, CodeScanningAlertBySeverityLevel, OrgRule } from '../types'

export const codeScanningAlertsRule: OrgRule = async (octokit: Octokit, cacheFile: CacheFile): Promise<void> => {
  try {
    let alerts: any = []
    let page = 1
    while (true) {
      const org = (await getEnv()).githubOrg
      const { data } = await octokit.request(`GET /orgs/${org}/code-scanning/alerts`, {
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
        const securitySeverity = (alert.rule?.security_severity_level.toLowerCase() ?? 'none') as keyof CodeScanningAlertBySeverityLevel

        repos[alert.repository.name].codeScanningAlerts[securitySeverity].push({
          rule: {
            id: alert.rule.id,
            severity: alert.rule.severity,
            description: alert.rule.description,
            tags: alert.rule.tags,
            securitySeverityLevel: alert.rule.security_severity_level ?? 'none'
          },
          tool: {
            name: alert.tool.name,
            version: alert.tool.version
          },
          mostRecentInstance: {
            ref: alert.most_recent_instance.ref,
            environment: alert.most_recent_instance.environment,
            category: alert.most_recent_instance.category,
            commitSha: alert.most_recent_instance.commit_sha,
            message: alert.most_recent_instance.message.text,
            locationPath: alert.most_recent_instance.location.path
          }
        })
      }
    }
  } catch (error) {
    errorHandler(error, codeScanningAlertsRule.name)
  }
}
