DEV, TEST AND PROD FROM ONE PUSH (project package)
===================================================

WHAT YOU BUILD
--------------
A deploy pipeline for the wharf's digital twin:

  * git push to main       -> a robot deploys DEV by itself
  * "manual" workflow      -> deploys (or destroys) TEST or PROD on request;
                              PROD waits for a person to approve
  * the same workflow      -> tears any environment down again

One folder of Terraform describes the whole twin (memory bucket, site bucket,
function, API gateway, CDN). The environment name feeds every resource name, and
each environment has its own Terraform workspace and state. State lives in a
shared bucket with a lock table. The robot signs in with a short-lived GitHub
token (OIDC), not a stored key.

This is a real cloud setup. It needs an AWS account and a GitHub repository.
Nothing here can run without them; the local checks only prove the files parse.

FOLDER STRUCTURE
----------------
22-dev-test-prod-from-one-push/
  README.txt
  env.example                   copy to .env
  final/                        the complete reference
    backend/                    the twin as a function (server.py, context.py, memory.py ...)
      data/                     the twin's facts (invented demo data)
    frontend/                   plain page: src/index.html, main.js, config.js; build.mjs
    infra/
      providers.tf              provider + shared-state backend
      variables.tf              environment, region, model per environment
      main.tf                   buckets, role, function, gateway, CDN
      outputs.tf                site_bucket, memory_bucket, site_url, api_url, cdn_id
      backend.hcl.example       copy to backend.hcl
    deploy.sh                   build, workspace, apply, upload, clear cache
    destroy.sh                  empty buckets, destroy, careful unlock
    scripts/bootstrap-state.sh  once: state bucket + lock table
    scripts/bootstrap-pipeline.sh  once: GitHub sign-in (OIDC) + pipeline role
    scripts/set-github-config.sh   once: secrets, variables, environments
    scripts/ensure-zip.sh       keeps "destroy" from failing on a missing zip
    iam/                        the pipeline role's trust policy and permissions
    workflows/deploy.yml        copy to .github/workflows/  (push -> dev)
    workflows/manual.yml        copy to .github/workflows/  (test, prod, destroy)
    gitignore.txt               copy to .gitignore BEFORE your first commit
  starter/                      same layout with TODO stubs

REQUIREMENTS
------------
- An AWS account set up safely (root locked away, limited daily user, budget
  alarm) and model access for the Nova models in ap-southeast-1
- AWS CLI v2, signed in as your daily user
- Terraform 1.5 or newer (checked with 1.9)
- GitHub: an empty repository you own, and the GitHub CLI (gh), signed in
- Python 3.12 with pip, Node 20+ with npm, zip, bash (macOS or Linux; Windows
  needs its own PowerShell version of the scripts)
- Bucket names must be unique worldwide: names here add your account id

INSTALL (one-time setup, in this order)
---------------------------------------
Work inside final/ (or starter/).
 1. cp ../env.example .env ; edit GITHUB_REPO ; then   set -a; source .env; set +a
 2. cp gitignore.txt .gitignore     (do this first; read "git status" before each commit)
 3. bash scripts/bootstrap-state.sh          -> state bucket, lock table, infra/backend.hcl
 4. bash scripts/bootstrap-pipeline.sh       -> GitHub sign-in provider + role "wharf-pipeline"
 5. bash scripts/set-github-config.sh        -> secrets, variable, environments (prod needs you)
 6. mkdir -p .github/workflows && cp workflows/*.yml .github/workflows/
 7. cd infra && terraform init -backend-config=backend.hcl
    (once, to make sure the state backend works from your laptop)

RUN
---
Dev, by push:
     git init -b main
     git add . && git status          (read every line)
     git commit -m "twin: first pipeline run"
     git remote add origin https://github.com/YOUR_GITHUB_NAME/YOUR_REPO_NAME.git
     git push origin main
     gh run watch
Test and prod, by hand (run from the main branch; the role trusts only main):
     gh workflow run manual.yml -f environment=test -f action=deploy
     gh workflow run manual.yml -f environment=prod -f action=deploy
     gh run list --workflow manual.yml      (prod shows "waiting": open the
                                              "plan" job's log, read it, then approve)
Locally, if you must (same script the robot uses):
     ./deploy.sh dev plan      (a plan only, changes nothing)

TEST / WHAT SUCCESS LOOKS LIKE
------------------------------
1. The run is green. The log ends with two lines like
     site: https://d1example.cloudfront.net
     api:  https://abc123.execute-api.ap-southeast-1.amazonaws.com
2. Open the site address. Say "Hi, I am Siti.", then "What is my name?": the twin
   says Siti. A fresh environment's plan shows only things to ADD.
3. After the first upload, if you still see old files, the CDN cache was not
   cleared: deploy.sh creates the invalidation for you.
4. Run "terraform plan" twice in a row in infra (select the workspace first):
   the second says "No changes".
5. Teardown, by pipeline:
     gh workflow run manual.yml -f environment=dev  -f action=destroy
     gh workflow run manual.yml -f environment=test -f action=destroy
     gh workflow run manual.yml -f environment=prod -f action=destroy   (waits for approval)
   Then prove it:
     aws s3 ls | grep wharf-twin                       (nothing)
     aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'wharf-twin')].FunctionName"   ([])

Failures and fixes:
 - "Not authorized to perform sts:AssumeRoleWithWebIdentity": the trust policy names
   the wrong repository, or you ran from a branch other than main. Fix GITHUB_REPO
   and run scripts/bootstrap-pipeline.sh again (delete the role first), or start the run from main.
 - "Error acquiring the state lock": a run was killed and left a lock. Check nobody is
   really running Terraform, then copy the lock ID from the message and run
   terraform force-unlock <id>. destroy.sh asks you first.
 - "state bucket not found" in the pipeline: the secret STATE_BUCKET has a stray space
   or wrong name. Set it again with printf %s (set-github-config.sh does).
 - destroy fails with "no such file backend/twin.zip": that is why scripts/ensure-zip.sh exists.

COST NOTE (approximate)
-----------------------
Idle, one environment costs cents a month (small buckets, a CDN with no traffic, a
function nobody calls, 14-day logs). The state bucket and lock table are a few
cents. Model calls are most of any bill. Three environments left running over a
weekend add up: destroy dev and test between sessions. The budget alarm tells you
AFTER money is spent; your own destroy habit is the first line of defence.
The pipeline role is deliberately limited to resources named wharf-twin-*, but
it is still learning-grade: tighten iam/pipeline-policy.json before real use.

CLEAN UP
--------
 1. Destroy every environment (command in step 5 above) and prove it is empty.
 2. Once per account, last:
      aws dynamodb delete-table --table-name wharf-tf-locks --region ap-southeast-1
      aws s3 rm s3://YOUR_STATE_BUCKET --recursive    (also delete old versions in the console)
      aws s3api delete-bucket --bucket YOUR_STATE_BUCKET
      aws iam delete-role-policy --role-name wharf-pipeline --policy-name pipeline
      aws iam delete-role --role-name wharf-pipeline
      aws iam delete-open-id-connect-provider --open-id-connect-provider-arn arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com
 3. Delete the GitHub secrets and variable, and the repository if it was only for this.
 4. Look at the cost page a day later; charges appear with a delay.

WHAT CHANGED SINCE THE PREVIOUS LESSON
--------------------------------------
The earlier lessons gave you pieces: Terraform files and workspaces, deploy and
destroy scripts, shared state with locks, and two GitHub workflows. Here they are
one working project. New here: the full main.tf (gateway, CDN and the function's
permissions were "left out" in the lessons), the five outputs, config.js (the page
learns the API address after apply), the CDN cache clear, ensure-zip.sh, and the
three bootstrap scripts that do the one-time setup.
