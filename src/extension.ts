import fs from 'fs';
import path from 'path';

import type { ExtensionContext } from 'vscode';
import { NodeVM } from 'vm2';
import { commands, window, workspace, StatusBarAlignment } from 'vscode';

import type { DecoderItem } from './decoders';
import { BinaryViewProvider } from './binary-view-provider';
import { builtinDecoders, defaultDecoder } from './decoders';
import { output } from './output';
import { state } from './state';

const vm = new NodeVM({
	eval: false,
	wasm: false,
	// @ts-expect-error
	strict: true,
});

const customDecoderWatchers = new Set<fs.FSWatcher>();

function resolveCustomDecoders() {
	const customDecodersConfiguration = workspace
		.getConfiguration('hexViewer')
		.get<Record<string, string>>('customDecoders');

	if (!customDecodersConfiguration) {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		window.showErrorMessage(`Couldn't read custom decoders configuration.`);
		return [];
	}

	const entries = Object.entries(customDecodersConfiguration);

	if (!entries.length) {
		return [];
	}

	const root = state.activeView
		? workspace.getWorkspaceFolder(state.activeView.document.uri)
		: workspace.workspaceFolders?.[0];

	if (!root) {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		window.showErrorMessage(`Couldn't resolve workspace root for custom decoders.`);
		return [];
	}

	if (root.uri.scheme !== 'file') {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		window.showWarningMessage(`Custom decoders are not supported in virtual workspaces.`);
		return [];
	}

	return entries.reduce<DecoderItem[]>((result, [label, file]) => {
		try {
			const destinationPath = path.isAbsolute(file) ? file : path.resolve(root.uri.fsPath, file);

			const currentWatcher = fs.watch(destinationPath, () => {
				if (customDecoderWatchers.has(currentWatcher)) {
					for (const watcher of customDecoderWatchers) {
						watcher.close();
					}

					customDecoderWatchers.clear();

					// eslint-disable-next-line @typescript-eslint/no-use-before-define
					return reloadDecoders();
				}
			});

			customDecoderWatchers.add(currentWatcher);

			const decoder: unknown = vm.runFile(destinationPath);

			if (typeof decoder !== 'function') {
				throw new TypeError(`Custom decoder '${label}' is not a function`);
			}

			result.push({
				label,
				decoder,
			});
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			window.showErrorMessage(`Error resolving custom decoder '${label}'. See output for details.`);
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			output.appendLine(`${error}\n`);
		}

		return result;
	}, []);
}

function reloadDecoders() {
	state.decoderItems = [...builtinDecoders, ...resolveCustomDecoders()];
	const activeDecoder = state.decoderItems.find((item) => item.label === state.activeDecoderStatusItem.text);
	return state.activeView?.useDecoder(activeDecoder?.decoder ?? defaultDecoder.decoder);
}

export function activate(context: ExtensionContext): void {
	state.decoderItems = [...builtinDecoders, ...resolveCustomDecoders()];

	state.activeDecoderStatusItem = window.createStatusBarItem(StatusBarAlignment.Right, 0);

	state.activeDecoderStatusItem.command = 'hexViewer.selectDecoder';
	state.activeDecoderStatusItem.tooltip = 'Select decoder';

	context.subscriptions.push(state.activeDecoderStatusItem);

	context.subscriptions.push(
		workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration('hexViewer')) {
				return reloadDecoders();
			}
		}),
	);

	context.subscriptions.push(
		commands.registerCommand('hexViewer.selectDecoder', async () => {
			const item = await window.showQuickPick(state.decoderItems);

			if (item && state.activeView) {
				state.activeDecoderStatusItem.text = item.label;
				await state.activeView.useDecoder(item.decoder);
			}
		}),
	);

	context.subscriptions.push(commands.registerCommand('hexViewer.reloadDecoders', reloadDecoders));

	context.subscriptions.push(BinaryViewProvider.register(context));
}
