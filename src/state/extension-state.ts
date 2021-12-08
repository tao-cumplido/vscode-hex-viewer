import { commands } from 'vscode';

import type { ViewState } from '../state';

export class ExtensionState {
	#activeView: ViewState | null = null;

	get activeView(): ViewState | null {
		return this.#activeView;
	}

	set activeView(value: ViewState | null) {
		this.#activeView = value;
		commands.executeCommand('setContext', 'hexViewer:openEditor', Boolean(value)).then(undefined, console.error);
	}
}
