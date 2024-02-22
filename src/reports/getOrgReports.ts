import { OrgReport } from './orgReports/OrgReport'
import { OrgMemberReport } from './orgReports/OrgMemberReport'
import { OrgTeamReport } from './orgReports/OrgTeamReport'

export interface OrgReports {
  orgReport: OrgReport
  orgMemberReport: OrgMemberReport
  orgTeamReport: OrgTeamReport
}

export function getOrgReports (): OrgReports {
  return {
    orgReport: new OrgReport(0, 'OrganizationReports', 'Details about the organization.', '1', 'Organization'),
    orgMemberReport: new OrgMemberReport(0, 'OrganizationReports', 'Details about the organization teams.', '1', 'Organization'),
    orgTeamReport: new OrgTeamReport(0, 'OrganizationReports', 'Details about the organization members.', '1', 'Organization')
  }
}
