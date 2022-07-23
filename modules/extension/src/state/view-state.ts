import type { Event, Webview } from 'vscode';
import { window, ProgressLocation } from 'vscode';

import type { ClientMessage, ClientMessageMap, HostMessage } from '@hex/types';

import type { BinaryDocument } from '../binary-document';
import type { DecoderItem } from '../decoders';

interface TypedWebview<R, P> extends Webview {
	readonly onDidReceiveMessage: Event<R>;
	readonly postMessage: (message: P) => Promise<boolean>;
}

export class ViewState {
	readonly webview: TypedWebview<ClientMessage, HostMessage>;
	readonly document: BinaryDocument;

	decoderItem: DecoderItem;

	constructor(webview: Webview, document: BinaryDocument, decoderItem: DecoderItem) {
		// @ts-expect-error
		this.webview = webview;
		this.document = document;
		this.decoderItem = decoderItem;

		webview.onDidReceiveMessage(async (message: ClientMessage) => {
			switch (message.type) {
				case 'ready':
					return this.handleReady();
				case 'fetch':
					return this.handleFetch(message.data);
			}
		});
	}

	async handleReady(): Promise<unknown> {
		return this.webview.postMessage({
			type: 'stat',
			data: {
				fileSize: this.document.byteLength,
			},
		});
	}

	async handleFetch({ offset, byteLength }: ClientMessageMap['fetch']): Promise<unknown> {
		return window.withProgress({ location: ProgressLocation.Window, title: 'Loading data...' }, async () => {
			const buffer = await this.document.read(offset, byteLength);
			await this.webview.postMessage({
				type: 'bytes',
				data: { offset, buffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteLength) },
			});
		});

		// return window.withProgress({ location: ProgressLocation.Window }, async () => {
		// 	return this.webview.postMessage({
		// 		type: 'text',
		// 		data: await this.document.decodeWith(this.decoderItem.decoder, offset, bytes),
		// 	});
		// });
	}
}
