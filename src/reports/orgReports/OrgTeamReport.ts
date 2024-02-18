import { Report, ReportData, Writers } from '../report'
import { GithubTeam } from '../../types'
import { HeaderTitles, ReportWriter } from '../../util'

export interface OrgMemberReportData extends GithubTeam, ReportData {}
export interface OrgMemberReportWriters extends Writers<OrgMemberReportData> {
  orgMemberReportWriter: ReportWriter<OrgMemberReportData>
}

export class OrgTeamReport extends Report<OrgMemberReportData, OrgMemberReportWriters, GithubTeam> {
  protected async runReport (item: GithubTeam, writers: OrgMemberReportWriters): Promise<void> {
    writers.orgMemberReportWriter.addRow(item)
  }

  protected getHeaderTitles (): HeaderTitles<OrgMemberReportData> {
    return {
      name: 'Team Name',
      slug: 'Team Slug',
      description: 'Description',
      privacy: 'Privacy',
      notificationSetting: 'Notification Settings',
      permission: 'Permission',
      members: 'Members',
      repos: 'Repos'
    }
  }

  protected getReportWriters (): OrgMemberReportWriters {
    return {
      orgMemberReportWriter: new ReportWriter<OrgMemberReportData>(this.getHeaderTitles(), this._outputDir, 'OrganizationTeams')
    }
  }

  public get name (): string {
    return OrgTeamReport.name
  }
}
