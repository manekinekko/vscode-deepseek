import * as vscode from 'vscode';

async function showDeprecationInformation() {
	const action = await vscode.window.showWarningMessage(
		'DeepSeek for GitHub Copilot is deprecated and can be uninstalled. '
		+ 'The @deepseek chat participant has been removed without a replacement. '
		+ 'Read more covers Copilot customizations, not a direct replacement for DeepSeek/Ollama chat.',
		{ modal: true },
		'Read more',
	);
	if (action === 'Read more') {
		const opened = await vscode.env.openExternal(
			vscode.Uri.parse('https://code.visualstudio.com/docs/agents/run/move-to-copilot'),
		);
		if (!opened) {
			throw new Error('Could not open the deprecation details in your browser.');
		}
	}
}

async function showDeprecationNotice(context: Pick<vscode.ExtensionContext, 'globalState'>) {
	const acknowledgedKey = 'deprecationNoticeAcknowledged';
	if (!context.globalState.get<boolean>(acknowledgedKey)) {
		await showDeprecationInformation();
		await context.globalState.update(acknowledgedKey, true);
	}
}

function reportNotificationError(error: unknown) {
	console.error('DeepSeek deprecation notification failed:', error);
	void vscode.window.showErrorMessage(
		`DeepSeek: ${error instanceof Error ? error.message : String(error)}`,
	);
}

export function activate(context: Pick<vscode.ExtensionContext, 'globalState' | 'subscriptions'>) {
	context.subscriptions.push(vscode.commands.registerCommand(
		'deepseek.showDeprecationInformation',
		() => showDeprecationInformation().catch(reportNotificationError),
	));
	void showDeprecationNotice(context).catch(reportNotificationError);
}

export function deactivate() {}
