import type { CustomDocument, Uri } from 'vscode';
import { workspace } from 'vscode';

import type { Decoder } from './decoders/type';

export class BinaryDocument implements CustomDocument {
	static async create(uri: Uri): Promise<BinaryDocument> {
		return new BinaryDocument(uri, await workspace.fs.readFile(uri));
	}

	readonly uri;
	readonly data;

	private constructor(uri: Uri, data: Uint8Array) {
		this.uri = uri;
		this.data = data;
	}

	decodeWith(decoder: Decoder): ReturnType<Decoder> {
		const result = decoder(this.data);
		const byteLength = result.reduce((n, value) => {
			if (typeof value === 'string' || value === null) {
				return n + 1;
			}

			return n + (value.length ?? 1);
		}, 0);

		if (byteLength > this.data.length) {
			return Array.from<null>({ length: this.data.length }).fill(null);
		}

		result.push(...Array.from<null>({ length: this.data.length - byteLength }).fill(null));

		return result;
	}

	async openCustomDocument(uri: Uri) {
		return BinaryDocument.create(uri);
	}

	dispose() {
		// nothing to dispose yet
	}
}
