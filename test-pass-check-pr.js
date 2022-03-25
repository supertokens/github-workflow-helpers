const { default: axios } = require("axios");

const linkToJob = "https://github.com/supertokens/supertokens-sql-plugin/actions/workflows/tests.yml";
const testJobName = "Run tests";

// this is an auto generated token for this action
// using which the API rate limit is 5000 requests / hour
let gitHubToken = process.env.GITHUB_TOKEN;
let startTime = Date.now();

function doJob() {
    console.log(
        `Environment Variables:
        - REPO: ${process.env.REPO}
        - BRANCH: ${process.env.BRANCH}
        - SOURCE_OWNER: ${process.env.SOURCE_OWNER}
        - CURRENT_SHA: ${process.env.CURRENT_SHA}\n`
    );
    console.log("Checking job status...");

    const currentOwnerAndRepoString = process.env.REPO;
    const sourceRepoWithOwnerString = `${process.env.SOURCE_OWNER}/${
      currentOwnerAndRepoString.split("/")[1]
    }`;

    axios.get(`https://api.github.com/repos/${sourceRepoWithOwnerString}/actions/runs?branch=${process.env.BRANCH}`, {
        headers: {
            'Authorization': `token ${gitHubToken}`
        }
    }).then(async result => {
        let data = result.data;
        let currentSHA = process.env.CURRENT_SHA;

        let foundActiveJob = false;
        let success = false;
        let failed = false;
        if (currentSHA !== undefined) {
            for (let i = 0; i < data.workflow_runs.length; i++) {
                let run = data.workflow_runs[i];
                if (run.head_sha === currentSHA) {
                    if (run.name === testJobName) {
                        if (run.conclusion === "success") {
                            success = true;
                        } else if (run.conclusion === "failure") {
                            failed = true;
                        }
                        if (run.status === "in_progress") {
                            foundActiveJob = true;
                        }
                    }
                }
            }
        }

        if (success) {
            console.log("Success!");
            process.exit(0);
            return;
        }

        if (foundActiveJob) {
            console.log("Waiting for job to finish...");
            return setTimeout(doJob, 30000) // try again after 30 seconds.
        }

        if (failed) {
            console.log("Test job failed. Exiting... Please rerun this job manually when you run the test job again...");
            process.exit(1);
            return;
        }

        console.log("You need to trigger the \"" + testJobName + "\" github action and make this job succeed");
        console.log("You can find the github action here: " + linkToJob);
        if ((Date.now() - startTime) > (3 * 60 * 1000)) {
            console.log("Test job not started after waiting for 3 mins... Exiting, please rerun this job manually.");
            process.exit(1);
        } else {
            setTimeout(doJob, 30000);
        }
    }).catch((e) => {
        console.log(e);
        console.log("Error thrown.. waiting for 1 min and trying again.");
        setTimeout(doJob, 60000) // try again after 1 min.
    })
}

doJob();