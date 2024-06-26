import { OrgReport } from './orgReports/OrgReport'
import { OrgMemberReport } from './orgReports/OrgMemberReport'
import { OrgTeamReport } from './orgReports/OrgTeamReport'
import { ReportType } from '../types'

export interface OrgReports {
  orgReport: OrgReport
  orgMemberReport: OrgMemberReport
  orgTeamReport: OrgTeamReport
}

export function getOrgReports (): OrgReports {
  return {
    orgReport: new OrgReport(0, 'OrganizationReports', 'Details about the organization.', '1', ReportType.ORGANIZATION),
    orgMemberReport: new OrgMemberReport(0, 'OrganizationReports', 'Details about the organization teams.', '1', ReportType.ORGANIZATION),
    orgTeamReport: new OrgTeamReport(0, 'OrganizationReports', 'Details about the organization members.', '1', ReportType.ORGANIZATION)
  }
}
