const vscode = require("vscode");
const clipboardy = require("clipboardy");

function activate(context) {
	let disposable = vscode.commands.registerCommand(
		"extension.createMergeRequest",
		async () => {
			// Get GitLab instance URL and access token from settings
			const instanceUrl = vscode.workspace
				.getConfiguration()
				.get("gitlabMergeRequest.instanceUrl", "https://gitlab.com");
			const accessToken = vscode.workspace
				.getConfiguration()
				.get("gitlabMergeRequest.accessToken");

			// Ensure access token is provided
			if (!accessToken) {
				vscode.window.showErrorMessage(
					"GitLab Access Token is required. Please configure it in settings."
				);
				return;
			}

			// Display input form
			const title = await vscode.window.showInputBox({
				prompt: "Enter Merge Request Title",
			});
			const description = await vscode.window.showInputBox({
				prompt: "Enter Merge Request description",
			});

			const branches = await getGitLabBranches(
				instanceUrl,
				projectName,
				accessToken
			);

			// Display input form
			const sourceBranch = await vscode.window.showQuickPick(branches, {
				placeHolder: "Select Source Branch",
			});

			const targetBranch = await vscode.window.showQuickPick(branches, {
				placeHolder: "Select Target Branch",
			});

			// ... add more input boxes for other fields

			// Generate merge request details
			const mergeRequestDetails = `
      Project: ${instanceUrl}
      Title: ${title}
      Description: ${description}
      Source Branch: ${sourceBranch}
      Target Branch: ${targetBranch}
      Assignee: ${assignee}
      ${deleteSourceBranch ? "Delete Source Branch on Accept" : ""}
      ${squashCommits ? "Squash Commits on Accept" : ""}
      Link: ${generateMergeRequestLink(
			instanceUrl,
			projectName,
			sourceBranch,
			targetBranch
		)}
    `;

			// Copy to clipboard
			clipboardy.writeSync(mergeRequestDetails);

			// Show a notification
			vscode.window.showInformationMessage(
				"GitLab Merge Request details copied to clipboard!"
			);
		}
	);

	context.subscriptions.push(disposable);
}

async function getGitLabBranches(instanceUrl: string, projectName: string, accessToken: string): Promise<string[]> {
    const url = `${instanceUrl}/api/v4/projects/${encodeURIComponent(projectName)}/repository/branches`;
    try {
      const response = await axios.get(url, {
        headers: {
          'PRIVATE-TOKEN': accessToken
        }
      });
      return response.data.map((branch: any) => branch.name);
    } catch (error) {
      vscode.window.showErrorMessage(`Error fetching branches: ${error.message}`);
      return [];
    }
}

function generateMergeRequestLink(
	instanceUrl,
	projectName,
	sourceBranch,
	targetBranch
) {
	return `${instanceUrl}/${projectName}/merge_requests/new?source_branch=${sourceBranch}&target_branch=${targetBranch}`;
}

function deactivate() {}

module.exports = {
	activate,
	deactivate,
};
