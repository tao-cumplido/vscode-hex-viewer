import type { ExtensionContext } from 'vscode';
import { commands, window } from 'vscode';

import { BinaryViewProvider } from './binary-view-provider';
import { builtinDecoders } from './decoders';
import { state } from './state';

export function activate(context: ExtensionContext): void {
	const selectDecoderCommand = commands.registerCommand('hexViewer.selectDecoder', async () => {
		const decoderName = await window.showQuickPick(Object.keys(builtinDecoders));

		if (decoderName && state.activeView) {
			const decoder = builtinDecoders[decoderName];

			if (decoder) {
				await state.activeView.useDecoder(decoder);
			}
		}
	});

	context.subscriptions.push(selectDecoderCommand);
	context.subscriptions.push(BinaryViewProvider.register(context));
}
