// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

async function quickSwitch() {
	let items: vscode.QuickPickItem[] = [];

	const recentlyOpened: any = await vscode.commands.executeCommand('_workbench.getRecentlyOpened');
	let index: number = 0;
	for(let recentItem of recentlyOpened.workspaces) {
		if('workspace' in recentItem) {
			index += 1;
			items.push( {
				label: "[Recent " + index + "]",
				description: recentItem.workspace.configPath.fsPath,
			});
		}
	}

	let options: vscode.QuickPickOptions = {
		placeHolder: "Select the Workspace you want to switch to:",
		canPickMany: false,
		ignoreFocusOut: true,
		matchOnDescription: true,
		matchOnDetail: true
	};

	let pickedItem = await vscode.window.showQuickPick(items, options);
	let path = pickedItem?.description ?? null;

	if(path){
		let workspaceUri = vscode.Uri.file(path);
		// Open the Workspace
		await vscode.commands.executeCommand('vscode.openFolder', workspaceUri);
	}
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('finnworkspace.quickswitch', () => {
		quickSwitch();
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
