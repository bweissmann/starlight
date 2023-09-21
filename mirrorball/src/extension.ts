// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CallExpression, Project, SyntaxKind } from 'ts-morph';
import { getRedisClient } from './redis';
import { v4 as uuid } from 'uuid';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "mirrorball" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('mirrorball.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from the mirrorball!');
	});

	context.subscriptions.push(disposable);

	// SAMPLE ^^

	vscode.commands.registerCommand(COMMAND, generate);

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('typescript', new BlankspaceActionProvider(), {
			providedCodeActionKinds: BlankspaceActionProvider.providedCodeActionKinds
		})
	);
}

function generate(call: CallExpression) {
	getRedisClient().then(client => {
		console.log("Sending to redis");
		if (!client) {
			console.error("Could not connect to Redis, unable to generate prompt");
			return;
		}
		client.xAdd('mirrorball', '*', { "type": "request", "uuid": uuid(), "input": stripQuotes(call.getArguments()[0].getText()) });
	});
}

function stripQuotes(text: string): string {
	if ((text.startsWith('"') && text.endsWith('"'))
		|| (text.startsWith("'") && text.endsWith("'"))
		|| text.startsWith('`') && text.endsWith('`')) {
		return text.slice(1, -1);
	}
	return text;
}

const COMMAND = 'mirrorball.generate';

export class BlankspaceActionProvider implements vscode.CodeActionProvider {
	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext): vscode.CodeAction[] {

		const diagnostics = context.diagnostics.filter(d => d.code === 2345).map(d => ({ diagnostic: d, call: findCallExpression(document.uri.fsPath, d.range) })).filter((item): item is { call: CallExpression, diagnostic: vscode.Diagnostic } => item.call !== undefined);
		const gotoprompt = diagnostics.length > 0 ? [new vscode.CodeAction('(unimplemented) Blankspace: Go To Prompt', vscode.CodeActionKind.QuickFix)] : [];

		return [...diagnostics.map(d => {
			const action = new vscode.CodeAction('Blankspace: Generate prompt', vscode.CodeActionKind.QuickFix);
			action.command = { command: COMMAND, title: 'Generate Prompt', arguments: [d.call] };
			return action;
		}),
			// ...gotoprompt
		];
	}
}

function findCallExpression(filePath: string, range: vscode.Range): CallExpression | undefined {
	try {
		const project = new Project();
		const sourceFile = project.addSourceFileAtPath(filePath);

		// Convert VSCode's position to ts-morph's position.
		const startPos = sourceFile.
			compilerNode.getPositionOfLineAndCharacter(range.start.line, range.start.character);
		const node = sourceFile.getDescendantAtPos(startPos);

		if (node) {
			const callExpression = node.getFirstAncestorByKind(SyntaxKind.CallExpression);
			if (callExpression && callExpression.getExpression().getText().replace(/\s/g, "") === "blankspace.build") {
				const args = callExpression.getArguments();
				return callExpression;
			}
		}
		return undefined;
	} catch (e) {
		return undefined;
	}
}

// This method is called when your extension is deactivated
export function deactivate() { }
