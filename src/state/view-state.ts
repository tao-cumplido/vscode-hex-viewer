import type { Webview } from 'vscode';

import type { BinaryDocument } from '../binary-document';
import type { Decoder } from '../decoders/type';
import { builtinDecoders } from '../decoders';

export class ViewState {
	private firstRun = true;
	private decoder: Decoder;

	readonly webview: Webview;
	readonly document: BinaryDocument;

	get decoderName(): string {
		const entry = Object.entries(builtinDecoders).find(([_, decoder]) => decoder === this.decoder);

		if (!entry) {
			throw new Error(`unexpected missing decoder name lookup`);
		}

		return entry[0];
	}

	constructor(webview: Webview, document: BinaryDocument, decoder: Decoder) {
		this.webview = webview;
		this.document = document;
		this.decoder = decoder;

		webview.onDidReceiveMessage(async (message) => {
			if (message === 'ready') {
				const { buffer, byteOffset, byteLength } = document.data;
				const bytes = buffer.slice(byteOffset, byteOffset + byteLength);

				await webview.postMessage({ type: 'bytes', data: bytes });

				await this.useDecoder(this.decoder);

				this.firstRun = false;
			}
		});
	}

	async useDecoder(decoder: Decoder): Promise<void> {
		if (!this.firstRun) {
			await this.webview.postMessage({ type: 'decoded', data: null });
		}

		this.decoder = decoder;

		await this.webview.postMessage({ type: 'decoded', data: decoder(this.document.data) });
	}
}
