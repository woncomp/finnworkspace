// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import { basename } from 'path';

type FavItem = [string, string];

const KeyFavoriteWorkspaces = 'finnworkspace.favorites';
const LabelNoKnownWorkspace = 'No known workspace';

function pathExists(path: string): boolean {
	try
	{
		fs.accessSync(path, fs.constants.R_OK);
	} catch (err) {
		return false;
	}
	return true;
}

function getFavorites(context: vscode.ExtensionContext): FavItem[] {
	return context.globalState.get(KeyFavoriteWorkspaces) as FavItem[] ?? [];
}

async function favoriteAdd(context: vscode.ExtensionContext) {
	let items: string[] = [];

	let favPaths = new Set<string>();
	let favs = getFavorites(context);
	for(let fav of favs) {
		favPaths.add(fav[1]);
	}

	const recentlyOpened: any = await vscode.commands.executeCommand('_workbench.getRecentlyOpened');
	for(let recentItem of recentlyOpened.workspaces) {
		if('workspace' in recentItem) {
			let path = recentItem.workspace.configPath.fsPath;
			if(favPaths.has(path)) continue;
			if(!pathExists(path)) continue;

			items.push(path);
		}
	}

	if(items.length == 0)
	{
		items.push(LabelNoKnownWorkspace);
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
	if(!pathExists(pickedWorkspacePath)) return;

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
	for(let fav of favs) {
		let path: string = fav[1];

		let label = pathExists(path) ? fav[0] : fav[0] + ' (deleted)';

		items.push( {
			label: label,
			description: path,
		});
	};

	if(items.length == 0)
	{
		items.push( {
			label: LabelNoKnownWorkspace
		});
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
	if(pickedItem.label == LabelNoKnownWorkspace) return;

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
	for(let fav of favs) {
		let path: string = fav[1];
		addedPaths.add(path);

		if(!pathExists(path)) continue;

		items.push( {
			label: fav[0],
			description: path,
		});
	};

	const recentlyOpened: any = await vscode.commands.executeCommand('_workbench.getRecentlyOpened');
	let index: number = 0;
	for(let recentItem of recentlyOpened.workspaces) {
		if('workspace' in recentItem) {
			let path = recentItem.workspace.configPath.fsPath;

			if(addedPaths.has(path)) continue;
			addedPaths.add(path);
			if(!pathExists(path)) continue;

			index += 1;
			items.push( {
				label: "[Recent " + index + "]",
				description: path,
			});
		}
	}

	if(items.length == 0)
	{
		items.push( {
			label: LabelNoKnownWorkspace
		});
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

	if(path && pathExists(path)) {
		// Update the fav list if the selected path is in Favorite
		function _move_to_front(path: string) {
			for(let idx=0; idx<favs.length; idx++) {
				let fav = favs[idx];
				if(fav[1] != path) continue;
	
				favs.splice(idx, 1);
				favs.splice(0, 0, fav);
				break;
			}
		}
		_move_to_front(path);
		_move_to_front(vscode.workspace.workspaceFile?.fsPath ?? "");
		context.globalState.update(KeyFavoriteWorkspaces, favs);

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
