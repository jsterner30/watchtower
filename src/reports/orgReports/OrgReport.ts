import { Report, ReportData, Writers } from '../report'
import { GithubOrganization } from '../../types'
import { HeaderTitles, ReportWriter } from '../../util'

export interface OrgReportData extends GithubOrganization, ReportData {}
export interface OrgReportWriters extends Writers<OrgReportData> {
  orgReportWriter: ReportWriter<OrgReportData>
}

export class OrgReport extends Report<OrgReportData, OrgReportWriters, GithubOrganization> {
  protected async runReport (item: GithubOrganization): Promise<void> {
    this._reportWriters.orgReportWriter.addRow(item)
  }

  protected getHeaderTitles (): HeaderTitles<OrgReportData> {
    return {
      name: 'Org Name',
      description: 'Description',
      email: 'Email',
      members: 'Members',
      repoCount: 'Repo Count',
      publicRepoCount: 'Public Repo Count',
      createdDateTime: 'Created Date Time',
      teams: 'Teams',
      type: 'Type',
      privateRepoCount: 'Private Repo Count',
      ownedPrivateRepoCount: 'Owned Private Repo Count',
      diskUsage: 'Disk Usage',
      billingEmail: 'Billing Email',
      defaultRepoPermission: 'Default Repo Permission',
      membersCanCreateRepos: 'Members Can Create Repos',
      twoFAEnabled: 'Two Factor Authentication Enabled',
      membersAllowedRepositoryCreationType: 'Members Allowed Repository Creation Type',
      membersCanCreatePublicRepositories: 'Members Can Create Public Repositories',
      membersCanCreatePrivateRepositories: 'Members Can Create Private Repositories',
      membersCanCreateInternalRepositories: 'Members Can Create Internal Repositories',
      membersCanCreatePages: 'Members Can Create Pages',
      membersCanForkPrivateRepositories: 'Members Can Fork Private Repositories',
      webCommitSignoffRequired: 'Web Commit Signoff Required',
      membersCanCreatePublicPages: 'Members Can Create Public Pages',
      membersCanCreatePrivatePages: 'Members Can Create Private Pages',
      planName: 'Plan Name',
      planSpace: 'Plan Space',
      planPrivateRepos: 'Plan Private Repos',
      planFilledSeats: 'Plan Filled Seats',
      planSeats: 'Plan Seats',
      advancedSecurityEnabledForNewRepositories: 'Advanced Security Enabled For New Repositories',
      dependabotAlertsEnabledForNewRepositories: 'Dependabot Alerts Enabled For New Repositories',
      dependabotSecurityUpdatesEnabledForNewRepositories: 'Dependabot Security Updates Enabled For New Repositories',
      dependencyGraphEnabledForNewRepositories: 'Dependency Graph Enabled For New Repositories',
      secretScanningEnabledForNewRepositories: 'Secret Scanning Enabled For New Repositories',
      secretScanningPushProtectionEnabledForNewRepositories: 'Secret Scanning Push Protection Enabled For New Repositories',
      secretScanningPushProtectionCustomLinkEnabled: 'Secret Scanning Push Protection Custom Link Enabled',
      secretScanningPushProtectionCustomLink: 'Secret Scanning Push Protection Custom Link',
      secretScanningValidityChecksEnabled: 'Secret Scanning Validity Checks Enabled'
    }
  }

  protected initReportWriters (): OrgReportWriters {
    return {
      orgReportWriter: new ReportWriter<OrgReportData>(this.getHeaderTitles(), this._outputDir, 'OrganizationInfo', this.getExceptions())
    }
  }

  public get name (): string {
    return OrgReport.name
  }
}
