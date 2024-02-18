import { Report, ReportData, Writers } from '../report'
import { GithubMember } from '../../types'
import { HeaderTitles, ReportWriter } from '../../util'

export interface OrgMemberReportData extends GithubMember, ReportData {}
export interface OrgMemberReportWriters extends Writers<OrgMemberReportData> {
  orgMemberReportWriter: ReportWriter<OrgMemberReportData>
}

export class OrgMemberReport extends Report<OrgMemberReportData, OrgMemberReportWriters, GithubMember> {
  protected async runReport (item: GithubMember, writers: OrgMemberReportWriters): Promise<void> {
    writers.orgMemberReportWriter.addRow(item)
  }

  protected getHeaderTitles (): HeaderTitles<OrgMemberReportData> {
    return {
      name: 'Username',
      type: 'Type'
    }
  }

  protected getReportWriters (): OrgMemberReportWriters {
    return {
      orgMemberReportWriter: new ReportWriter<OrgMemberReportData>(this.getHeaderTitles(), this._outputDir, 'OrganizationMembers')
    }
  }

  public get name (): string {
    return OrgMemberReport.name
  }
}
