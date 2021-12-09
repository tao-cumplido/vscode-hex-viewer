import type { StatusBarItem } from 'vscode';
import { commands } from 'vscode';

import type { ViewState } from '../state';

export class ExtensionState {
	#activeView: ViewState | null = null;
	#activeDecoderStatusItem?: StatusBarItem;

	get activeView(): ViewState | null {
		return this.#activeView;
	}

	set activeView(value: ViewState | null) {
		this.#activeView = value;
		commands.executeCommand('setContext', 'hexViewer:openEditor', Boolean(value)).then(undefined, console.error);
	}

	get activeDecoderStatusItem(): StatusBarItem {
		if (!this.#activeDecoderStatusItem) {
			throw new Error(`activeDecoderStatusItem hasn't been assigned yet`);
		}

		return this.#activeDecoderStatusItem;
	}

	set activeDecoderStatusItem(value: StatusBarItem) {
		this.#activeDecoderStatusItem = value;
	}
}
