import type { ExtensionContext } from 'vscode';

import { BinaryViewProvider } from './binary-view-provider';

export function activate(context: ExtensionContext): void {
	context.subscriptions.push(BinaryViewProvider.register(context));
}
