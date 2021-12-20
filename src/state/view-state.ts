import type { Webview } from 'vscode';

import type { BinaryDocument } from '../binary-document';
import type { DecoderItem } from '../decoders';

export class ViewState {
	private firstRun = true;

	readonly webview: Webview;
	readonly document: BinaryDocument;

	decoderItem: DecoderItem;

	constructor(webview: Webview, document: BinaryDocument, decoderItem: DecoderItem) {
		this.webview = webview;
		this.document = document;
		this.decoderItem = decoderItem;

		webview.onDidReceiveMessage(async (message) => {
			if (message === 'ready') {
				const { buffer, byteOffset, byteLength } = document.data;
				const bytes = buffer.slice(byteOffset, byteOffset + byteLength);

				await webview.postMessage({ type: 'bytes', data: bytes });

				await this.updateDecodedData();

				this.firstRun = false;
			}
		});
	}

	async updateDecodedData(): Promise<void> {
		if (!this.firstRun) {
			await this.webview.postMessage({ type: 'text', data: null });
		}

		const data = this.document.decodeWith(this.decoderItem.decoder);

		await this.webview.postMessage({
			type: 'text',
			data: data ?? Array.from<null>({ length: this.document.data.length }).fill(null),
		});
	}
}
