import type { ExtensionContext } from 'vscode';
import { commands, window, workspace, StatusBarAlignment } from 'vscode';

import { BinaryViewProvider } from './binary-view-provider';
import { resolveCustomDecoders } from './custom-decoders';
import { builtinDecoders, defaultDecoder } from './decoders';
import { state } from './state';

function reloadDecoders() {
	state.decoderItems = [...builtinDecoders, ...resolveCustomDecoders(reloadDecoders)];
	state.allViews.forEach((view) => {
		const item = state.decoderItems.find(({ label }) => label === view.decoderItem.label);
		view.decoderItem = item ?? defaultDecoder;
	});
	state.visibleViews.forEach((view) => {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		view.updateDecodedData();
	});
}

export function activate(context: ExtensionContext): void {
	state.decoderItems = [...builtinDecoders, ...resolveCustomDecoders(reloadDecoders)];

	state.activeDecoderStatusItem = window.createStatusBarItem(StatusBarAlignment.Right, 0);

	state.activeDecoderStatusItem.command = 'hexViewer.selectDecoder';
	state.activeDecoderStatusItem.tooltip = 'Select decoder';

	context.subscriptions.push(state.activeDecoderStatusItem);

	context.subscriptions.push(
		workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration('hexViewer')) {
				reloadDecoders();
			}
		}),
	);

	context.subscriptions.push(
		commands.registerCommand('hexViewer.selectDecoder', async () => {
			const item = await window.showQuickPick(state.decoderItems);

			if (item && state.activeView) {
				state.activeDecoderStatusItem.text = item.label;
				state.activeView.decoderItem = item;
				await state.activeView.updateDecodedData();
			}
		}),
	);

	context.subscriptions.push(commands.registerCommand('hexViewer.reloadDecoders', reloadDecoders));

	context.subscriptions.push(BinaryViewProvider.register(context));
}
