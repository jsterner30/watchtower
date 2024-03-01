# Watchtower 

This repo is a tool for scanning Github organizations to gather large amounts of data about the repos in the org. It first gathers gets info about the repos in an org, then retrieves branch info for every branch of ever repo. The script then downloads each branch as a zip file to memory and runs certain rules on it to parse information from files on that branch. Reports are then ran on the information obtained from parsing the files. 

## Definitions
### Rules

A rule is a class that gathers data. The data can be gathered from an API call, by scanning the downloaded zip file of a branch, or by other means. This data is then written to a JSON file to act as a cache.

There are three types of rules: 
- Branch Rules: Gather data about a branch.


- Secondary Branch Rules: Run after Branch Rules, rely on data gathered during branch rules (for example, we cannot tell if a branch is deployed through GH Actions until we parse GHA files using the dotGithubRule, therefore it is a secondary rule)


- Repo Rules: These rules make a single API call to the whole repo, then map the data to individual branches. This saves us dozens of API calls.


- Org Rules: These rules make a single API call to the whole org, then map the data to a repo. This saves us hundreds of API calls.

### Stale Branches

A stale branch is a branch that is not a default branch, protected branch, deployed branch, or a branch recently committed to. Default and protected branches are attributes set in a repo's settings. This script decides that a branch is "deployed" if the branch is listed in a GHA file called "deploy.yml" on the default branch. A branch is otherwise stale if it has not had a new commit in 30 days, although this 30 day value can be changed using the STALE_DAYS_THRESHOLD environment variable.

### Report Output Types

Some things, like the reporting if a repo is public or internal, can be represented in a single csv file very simply. Other things are more complicated. For example, when reporting on the lowest node version in a repo, which branch or branches should be considered in the report? And even more difficult is how to report on dependency versions when there are thousands of individual library dependencies in an org.

To solve these issues, this script outputs different csv files in different ways:
- Simple Reports: these reports can be output to a set of csv files and are a simple data mapping.


- Versioning Reports: these reports (like node and terraform version) are contained in a subdirectory that contains three files:
  1. The lowest and highest version on every relevant branch in the org (each row is a branch)
  2. The lowest and highest version in each repo, considering every branch in the repo (each row is a repo)
  3. The lowest and highest version in each repo, considering only the default branch (each row is a repo)


- Dependency Reports: These are reports for dependencies that cannot be enumerated (like every npm dependency in the org). They are in a subdirectory with a csv file matching the dependency name. Each row in that csv file corresponds to a branch using that dependency, and in ach row we record the version of the dependency found on that branch. 

### File Structure of Cache and Report Outputs

In s3 and locally, files are written to a structure like the following:
```
.
 └── data/
     ├── cache/
     │   └── json/
     │       ├── lastRunDate.json
     │       └── etc.json
     └── reports/
         ├── csv/
         │   └── reportDir/
         │       └── report.csv
         └── json/
             └── reportDir/
                 └── report.json
```

### Reports

For information on reports, [see the automatically generated reports.md file](reports.md)

If you add a report to the list of reports retrieved by the engine, the reports information should automatically be written to the reports.md file when you make your commit. Alternatively, you can run ```npm run genReportDocs``` to regenerate the reports.md file at any time. 

### Overall Health Scoring

Many reports contribute to an overall heath score for each repo. These scores are calculated like GPA, where each contributing report has a weight and a letter grade associated with it.

Each report calculates its own grade. Reports that do not apply to a repo do not affect the repo's overall score. The three report types generally calculate a grade in the following ways:

- Simple: simple report graded are calculated by comparing the actual value to an optimal value.

- Version: we use the lowest version on any branch of a repo and compare it to an optimal version to find a grade.

- Dependency Reports: these are more difficult to grade. Theoretically we could try to find the most recent version of every dependency, but this could be difficult. Instead, we use a relative grading scheme. We look at the version of a given dependency on a branch of some repo, and then compare it to the highest and lowest of that dependency in the org. This comparison gives us a letter grade by finding the spread between the overall highest and lowest versions and grading on a scale between that spread. Unique dependencies used by a single repo are graded as a C.
  Each of these dependency grades contributes to the overall grade for the dependency environment for a repo, so that each npm dependency would contribute to the overall npm grade.


## Running Locally

Env Vars: 
You can copy the below environment variables into your run configuration
```
AWS_REGION=us-west-2;
AWS_PROFILE=<aws-account-name>
BUCKET_NAME=watchtower-dev-output;
ENVIRONMENT_NAME=dev
GITHUB_ORG=<your-org>;
GITHUB_TOKEN=<your-token>;
STALE_DAYS_THRESHOLD=30;
SHOW_PROGRESS=true;
USE_CACHE=true;
WRITE_FILES_LOCALLY-true;
```

| Env Var Name         | Description                                                                                                                                                                                                                      | Required | Default Value |
|----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|---------------|
| AWS_REGION           | Not positive this is necessary, but may be needed to access s3 bucket                                                                                                                                                            | true     |               |
| AWS_PROFILE          | Needed to access s3 bucket                                                                                                                                                                                                       | true     |               |
| BUCKET_NAME          | The bucket where the cache and report outputs will be written (if WRITE_FILES_LOCALLY is set to false)                                                                                                                           | true     |               |
| ENVIRONMENT_NAME     | Either 'dev' or 'prd'                                                                                                                                                                                                            | false    | dev           |
| GITHUB_ORG           | The name of the Github organization to scan                                                                                                                                                                                      | true     |               |
| GITHUB_TOKEN         | This tool will work best if your GITHUB_TOKEN is a token associated with admin privileges over your organization, otherwise certain rules (getting Code Scanning results and admin teams for example) may not function properly. | true     |               |
| STALE_DAYS_THRESHOLD | The amount of time in days until a non-deployed, unprotected, and non-default branch is considered "stale".                                                                                                                      | false    | 30            |
| SHOW_PROGRESS        | A boolean that, if set to true, allows the progress bar to be shown in the console during long operations.                                                                                                                       | false    | false         |
| USE_CACHE            | A boolean that, if set to true, tells the tool to use data cached from previous runs to decrease runtime.                                                                                                                        | false    | false         |
| WRITE_FILES_LOCALLY  | A boolean that, if set to true, tells the script to write output files to your local machine. Otherwise the script will attempt to output them to the s3 bucket defined in the BUCKET_NAME variable.                             | false    | false         |

After adding these environment variables to your run configuration, you should log into the AWS account where your s3 bucket is stored if you plan on using that feature:

```aws sso login```

the tool can be started by running the below command:

```node --env-file=.env -r ts-node/register src/index.ts```

or 

```npm run dev```


### Environments

This repo has both dev and prd branches. The dev scheduled job is set to never run and the dev environment exists primarily to test new features. It should be invoked manually when needed. 

## Downloading Data

Step 0 (One time): Install awscli

```pip install awscli```

Step 1: Log Into the ces-architects-prd AWS Account

Step 2: Download Data

```aws s3 sync s3://watchtower-prd-output ./```

## Todos

1. Non npm repos getting 0 on npm dep grade? Possible bug
2. Dynamic LTS versioning for things besides node
3. Create rfc template and use in GH actions for standard change
4. Get teams webhook url and use in GH actions for teams notification
5. access tokens/ non expiring tokens? Is it even possible to get non fine grained tokens?
6. manually added org github users?
7. replace sinon in tests with native ts-mockito implementation
8. versions should be valid semver in version reports 
9. paths should remove repo and commit hash in filePath in version reports
10. Make graded reports return a grading object with an abstract parent function
11. parse codeowners files in a dotgithub rule
12. parse tfvars files in terraform rule
