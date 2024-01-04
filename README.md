# Watchtower 

This repo is a tool for scanning Github organizations to gather large amounts of data about the repos in the org. It first gathers gets info about the repos in an org, then retrieves branch info for every branch of ever repo. The script then downloads each branch as a zip file to memory and runs certain rules on it to parse information from files on that branch. Reports are then ran on the information obtained from parsing the files. 

## Definitions
### Rules

A rule is a function that gathers data. The data can be gathered from an API call, by scanning the downloaded zip file of a branch, or by other means. This data is then written to a JSON file to act as a cache.

There are three types of rules: 
- Branch Rules: Gather data on a branch 


- Secondary Branch Rules: Run after Branch Rules, rely on data gathered during branch rules (for example, we cannot tell if a branch is deployed through GH Actions until we parse GHA files using the dotGithubRule, therefore it is a secondary rule)


- Org Rules: These rules make a single API call to the whole org, then map the data to a repo. This saves us hundreds of API calls.

### Reports

Reports are functions that aggregate the data gathered by a rule and output it to a csv file. They run very quickly and therefore have no need to be cached. 

### Stale Branches

A stale branch is a branch that is not a default branch, protected branch, deployed branch, or a branch recently committed to. Default and protected branches are attributes set in a repo's settings. This script decides that a branch is "deployed" if the branch is listed in a GHA file called "deploy.yml" on the default branch. A branch is otherwise stale if it has not had a new commit in 30 days, although this 30 day value can be changed using the STALE_DAYS_THRESHOLD environment variable.

### Report Outputs

Some things, like the reporting if a repo is public or internal, can be represented in a single csv file very simply. Other things are more complicated. For example, when reporting on the lowest node version in a repo, which branch or branches should be considered in the report? And even more difficult is how to report on dependency versions when there are thousands of individual library dependencies in an org.

To solve these issues, this script outputs different csv files in different ways:
- Simple Reports: these reports can be output to a single csv file.


- Versioning Reports: these reports (like node and terraform version) are contained in a subdirectory that contains four files:
  1. The lowest and highest version on every relevant branch in the org (each row is a branch)
  2. The lowest and highest version on each non-stale branch in the org (each row is a branch)
  3. The lowest and highest version in each repo, considering every branch in the repo (each row is a repo)
  4. The lowest and highest version in each repo, considering only non-stale branches in the repo (each row is a repo)


- Dependency Reports: These are reports for dependencies that cannot be enumerated (like every npm dependency in the org). They are in a subdirectory with a csv file matching the dependency name. Each row in that csv file corresponds to a branch using that dependency, and in ach row we record the version of the dependency found on that branch. 

### Overall Health Score 

Most reports contribute to an overall heath score for each repo. These scores are calculated like GPA, where each contributing report has a weight and a letter grade associated with it.  

Each report calculates its own grade. Reports that do not apply to a repo do not affect the repo's overall score. The three report types generally calculate a grade in the following ways:

- Simple: simple report graded are calculated by comparing the actual value to an optimal value.

- Version: we use the lowest version on any branch of a repo and compare it to an optimal version to find a grade.

- Dependency Reports: these are more difficult to grade. Theoretically we could try to find the most recent version of every dependency, but this could be difficult. Instead, we use a relative grading scheme. We look at the version of a given dependency on a branch of some repo, and then compare it to the highest and lowest of that dependency in the org. This comparison gives us a letter grade by finding the spread between the overall highest and lowest versions and grading on a scale between that spread. Unique dependencies used by a single repo are graded as a C.
Each of these dependency grades contributes to the overall grade for the dependency environment for a repo, so that each npm dependency would contribute to the overall npm grade. 

The overall health score for each repo is written to its own csv file. 

## Existing Reports

| Report                 | Type       | Description                                                                                                                                                                                                                                                                                                                                                                          | Contributes to Overall Healthscore Report | Weight |
|------------------------|------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------|--------|
| codeScanAlerts         | Simple     | Generates several CSV files found in the "CodeScanAlerts" and CodeScanAlertsCount subdirectories, giving information about GH Advanced Security code scanning alerts at each level: critical, high, medium,and low. The CodeScanAlertsCount directory just contains the amount of alerts at each level for each repo, while the CodeScanAlerts dir contains more detailed info.      | Yes                                       | 5      |
| dependabotAlerts       | Simple     | Generates several CSV files found in the "DependabotAlerts" and DependabotAlertsCount subdirectories, giving information about GH Advanced Security dependabot alerts at each level: critical, high, medium,and low. The DependabotAlertsCount directory just contains the amount of alerts at each level for each repo, while the DependabotAlerts dir contains more detailed info. | Yes                                       | 5      |
| dependabotBranch       | Simple     | Generates a csv file called "DependabotBranchReport.csv" with the amount of dependabot branches on every repo                                                                                                                                                                                                                                                                        | Yes                                       | 3      |
| devPrdBranches         | Simple     | Generates a csv file called "devPrdBranchReport.csv" listing repos without the standard dev/prd branch default and naming scheme                                                                                                                                                                                                                                                     | No                                        | N/A    |
| DockerfileImage        | Dependency | Generates csv files in the "dockerfileImages" subdirectory corresponding to all the images in the org                                                                                                                                                                                                                                                                                | Yes                                       | 3      |
| ghActionModule         | Dependency | Generates csv files in the "GHAModules" subdirectory corresponding to all the modules in the org                                                                                                                                                                                                                                                                                     | Yes                                       | 3      |
| language               | Simple     | Generates a csv file called "LanguageReport.csv" listing the primary language in each repo                                                                                                                                                                                                                                                                                           | No                                        | N/A    |
| lowFiles               | Simple     | Generates two csv files. One called "LowFileCountInRepoReport.csv" which lists the repos with a low (<5) file count on every branch. The second file, "LowFileCountOnBranchReport.csv", lists every branch in the org with a low file count                                                                                                                                          | Yes                                       | 1      |
| nodeVersion            | Version    | Generates a subdirectory "node" with four csv files                                                                                                                                                                                                                                                                                                                                  | Yes                                       | 5      |
| npmDependency          | Dependency | Generates csv files in the "NPMDependencies" subdirectory corresponding to all the deps in the org                                                                                                                                                                                                                                                                                   | Yes                                       | 3      |
| publicAndInternal      | Simple     | Generates a csv file called "PublicAndInternalReport.csv" listing repos that are public or internal                                                                                                                                                                                                                                                                                  | Yes                                       | 2      |
| reposWithoutNewCommits | Simple     | Generates a csv file called "ReposWithoutNewCommitsReport.csv" listing repos without a new commit in the last two years                                                                                                                                                                                                                                                              | Yes                                       | 1      |
| secretScanningAlerts   | Simple     | Generates several CSV files found in the "SecretAlerts" and "SecretAlertsCount" subdirectories, the SecretAlertsCount directory contains a file listing the number of secrets per repo, and the SecretAlerts directory contains the specific information for every secret                                                                                                            | Yes                                       | 5      |
| staleBranch            | Simple     | Generates a csv file called "StaleBranchReport.csv" listing the number of stale branches on every repo in the org                                                                                                                                                                                                                                                                    | Yes                                       | 3      |
| teamlessRepo           | Simple     | Generates a csv file called "TeamlessRepoReport.csv" listing the repos in the org that do not have an admin team in Github                                                                                                                                                                                                                                                           | Yes                                       | 4      |
| terraformModule        | Dependency | Generates csv files in the "terraformModules" subdirectory corresponding to all the tf modules in the org                                                                                                                                                                                                                                                                            | Yes                                       | 3      |
| terraformVersion       | Version    | Generates a subdirectory "terraform" with four csv files                                                                                                                                                                                                                                                                                                                             | Yes                                       | 5      |


## Todos

1. Create terraform/run in the cloud
2. Make reports more object-oriented
3. Non npm repos getting 0 on npm dep grade? Possible bug
4. Improve caching
5. Create more run options (run without cache, etc.)
6. Dynamic LTS versioning for things besides node
