import type { ExtensionContext } from 'vscode';
import { commands, window, workspace, QuickPickItemKind, StatusBarAlignment } from 'vscode';

import { BinaryViewProvider } from './binary-view-provider';
import { resolveCustomDecoders } from './custom-decoders';
import { builtinDecoders, defaultDecoder } from './decoders';
import { state } from './state';

declare module 'vscode' {
	// eslint-disable-next-line @typescript-eslint/no-namespace, @typescript-eslint/no-shadow
	export namespace window {
		export function showQuickPick<T extends QuickPickItem>(
			items: readonly T[] | Thenable<readonly T[]>,
			options?: QuickPickOptions,
			token?: CancellationToken,
		): Thenable<Exclude<T, QuickPickItem & { kind: QuickPickItemKind.Separator }> | undefined>;
	}
}

function reloadDecoders() {
	state.decoderItems = [...builtinDecoders, ...resolveCustomDecoders(reloadDecoders)];
	state.allViews.forEach((view) => {
		const item = state.decoderItems.find(({ label }) => label === view.decoderItem.label);
		view.decoderItem = item ?? defaultDecoder;
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		view.handleFetchText();
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
			const items =
				state.decoderItems.length > builtinDecoders.length
					? ([
							{ label: 'Built-in', kind: QuickPickItemKind.Separator },
							...builtinDecoders,
							{ label: 'Custom', kind: QuickPickItemKind.Separator },
							...state.decoderItems.slice(builtinDecoders.length),
					  ] as const)
					: builtinDecoders;

			const item = await window.showQuickPick(items);

			if (item && state.activeView) {
				state.activeDecoderStatusItem.text = item.label;
				state.activeView.decoderItem = item;
				await state.activeView.handleFetchText();
			}
		}),
	);

	context.subscriptions.push(commands.registerCommand('hexViewer.reloadDecoders', reloadDecoders));

	context.subscriptions.push(BinaryViewProvider.register(context));
}
