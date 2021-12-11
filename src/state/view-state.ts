import type { Webview } from 'vscode';

import type { BinaryDocument } from '../binary-document';
import type { PotentialDecoder } from '../decoders';
import { defaultDecoder } from '../decoders';
import { state } from './index';

export class ViewState {
	private firstRun = true;
	private decoder: PotentialDecoder;

	readonly webview: Webview;
	readonly document: BinaryDocument;

	get decoderName(): string {
		const item = state.decoderItems.find(({ decoder }) => decoder === this.decoder);

		if (!item) {
			this.useDecoder(defaultDecoder.decoder).catch(console.error);
			return defaultDecoder.label;
		}

		return item.label;
	}

	constructor(webview: Webview, document: BinaryDocument, decoder: PotentialDecoder) {
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

	async useDecoder(decoder: PotentialDecoder): Promise<void> {
		if (!this.firstRun) {
			await this.webview.postMessage({ type: 'decoded', data: null });
		}

		this.decoder = decoder;

		const data = this.document.decodeWith(decoder);

		await this.webview.postMessage({
			type: 'decoded',
			data: data ?? Array.from<null>({ length: this.document.data.length }).fill(null),
		});
	}
}
