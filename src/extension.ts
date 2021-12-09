import type { ExtensionContext } from 'vscode';
import { commands, window, StatusBarAlignment } from 'vscode';

import { BinaryViewProvider } from './binary-view-provider';
import { builtinDecoders } from './decoders';
import { state } from './state';

export function activate(context: ExtensionContext): void {
	state.activeDecoderStatusItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);

	state.activeDecoderStatusItem.command = 'hexViewer.selectDecoder';
	state.activeDecoderStatusItem.tooltip = 'Select Decoder';

	const selectDecoderCommand = commands.registerCommand('hexViewer.selectDecoder', async () => {
		const decoderName = await window.showQuickPick(Object.keys(builtinDecoders));

		if (decoderName && state.activeView) {
			const decoder = builtinDecoders[decoderName];

			if (decoder) {
				state.activeDecoderStatusItem.text = decoderName;
				await state.activeView.useDecoder(decoder);
			}
		}
	});

	context.subscriptions.push(state.activeDecoderStatusItem);
	context.subscriptions.push(selectDecoderCommand);
	context.subscriptions.push(BinaryViewProvider.register(context));
}
