import type { Webview } from 'vscode';

import type { BinaryDocument } from '../binary-document';
import type { Decoder } from '../decoders/type';

export class ViewState {
	private firstRun = true;
	private decoder?: Decoder;

	readonly webview: Webview;
	readonly document: BinaryDocument;

	constructor(webview: Webview, document: BinaryDocument, decoder: Decoder) {
		this.webview = webview;
		this.document = document;

		webview.onDidReceiveMessage(async (message) => {
			if (message === 'ready') {
				const { buffer, byteOffset, byteLength } = document.data;
				const bytes = buffer.slice(byteOffset, byteOffset + byteLength);

				await webview.postMessage({ type: 'bytes', data: bytes });

				if (this.firstRun) {
					await this.useDecoder(decoder);
				} else if (this.decoder) {
					await this.useDecoder(this.decoder);
				}
			}
		});
	}

	async useDecoder(decoder: Decoder): Promise<void> {
		if (!this.firstRun) {
			await this.webview.postMessage({ type: 'decoded', data: null });
		}

		this.firstRun = false;
		this.decoder = decoder;

		await this.webview.postMessage({ type: 'decoded', data: decoder(this.document.data) });
	}
}
