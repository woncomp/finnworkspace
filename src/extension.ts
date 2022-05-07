// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { basename } from 'path';

type FavItem = [string, string];

const KeyFavoriteWorkspaces = 'finnworkspace.favorites';

function getFavorites(context: vscode.ExtensionContext): FavItem[] {
	return context.globalState.get(KeyFavoriteWorkspaces) as FavItem[];
}

async function favoriteAdd(context: vscode.ExtensionContext) {
	let items: string[] = [];

	let favPaths = new Set<string>();
	let favs = getFavorites(context);
	if(favs) {
		for(let fav of favs) {
			favPaths.add(fav[1]);
		}
	}

	const recentlyOpened: any = await vscode.commands.executeCommand('_workbench.getRecentlyOpened');
	for(let recentItem of recentlyOpened.workspaces) {
		if('workspace' in recentItem) {
			let path = recentItem.workspace.configPath.fsPath;
			if(!favPaths.has(path)) {
				items.push(path);
			}
		}
	}

	let options: vscode.QuickPickOptions = {
		placeHolder: "Select the Workspace you want to add to Favorites:",
		canPickMany: false,
		ignoreFocusOut: true,
		matchOnDescription: true,
		matchOnDetail: true
	};

	let pickedWorkspacePath = await vscode.window.showQuickPick(items, options);
	if(!pickedWorkspacePath) return;

	let defaultWorkspaceName = basename(pickedWorkspacePath, ".code-workspace");
	const result = await vscode.window.showInputBox({
		value: defaultWorkspaceName,
		prompt: 'Please give a name to this workspace, this name is also used for filtering.'
	});
	if(!result) return;

	favs.push([result, pickedWorkspacePath]);
	context.globalState.update(KeyFavoriteWorkspaces, favs);

	vscode.window.showInformationMessage('Workspace added to Favorites:\n' + pickedWorkspacePath);
}

async function favoriteRemove(context: vscode.ExtensionContext) {
	let items: vscode.QuickPickItem[] = [];

	let favs = getFavorites(context);
	if(favs) {
		for(let fav of favs) {
			items.push( {
				label: fav[0],
				description: fav[1],
			});
		};
	}

	let options: vscode.QuickPickOptions = {
		placeHolder: "Select the Workspace you want to remove from Favorites:",
		canPickMany: false,
		ignoreFocusOut: true,
		matchOnDescription: true,
		matchOnDetail: true
	};

	let pickedItem = await vscode.window.showQuickPick(items, options);
	if(!pickedItem) return;

	const path = pickedItem.description ?? "";
	if(!path) return;

	favs = favs.filter( x => x[1] !== path);
	context.globalState.update(KeyFavoriteWorkspaces, favs);

	vscode.window.showInformationMessage('Workspace removed from Favorites:\n' + path);
}

async function quickSwitch(context: vscode.ExtensionContext) {
	let items: vscode.QuickPickItem[] = [];

	let addedPaths = new Set<string>();

	let favs = getFavorites(context);
	if(favs) {
		for(let fav of favs) {
			items.push( {
				label: fav[0],
				description: fav[1],
			});
			addedPaths.add(fav[1])
		};
	}

	const recentlyOpened: any = await vscode.commands.executeCommand('_workbench.getRecentlyOpened');
	let index: number = 0;
	for(let recentItem of recentlyOpened.workspaces) {
		if('workspace' in recentItem) {
			let path = recentItem.workspace.configPath.fsPath;
			if(!addedPaths.has(path)) {
				index += 1;
				items.push( {
					label: "[Recent " + index + "]",
					description: path,
				});
				addedPaths.add(path);
			}
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
	context.subscriptions.push(vscode.commands.registerCommand('finnworkspace.favoriteAdd', () => {
		favoriteAdd(context);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('finnworkspace.favoriteRemove', () => {
		favoriteRemove(context);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('finnworkspace.quickSwitch', () => {
		quickSwitch(context);
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}
