import type { CustomDocument, Uri } from 'vscode';
import { window, workspace } from 'vscode';

import type { DecoderResult, PotentialDecoder } from './decoders';
import { isDecoderResult } from './decoders';
import { output } from './output';

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

	decodeWith(decoder: PotentialDecoder): DecoderResult | null {
		try {
			const result: unknown = decoder(this.data);

			if (!isDecoderResult(result)) {
				// eslint-disable-next-line @typescript-eslint/no-floating-promises
				window.showErrorMessage(`Hex Viewer: Invalid decoder result.`);
				return null;
			}

			const byteLength = result.reduce((n, value) => {
				if (typeof value === 'string' || value === null) {
					return n + 1;
				}

				return n + (value.length ?? 1);
			}, 0);

			if (byteLength > this.data.length) {
				return null;
			}

			result.push(...Array.from<null>({ length: this.data.length - byteLength }).fill(null));

			return result;
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			window.showErrorMessage(`Hex Viewer: Error while decoding data. See output for details.`);
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			output.appendLine(`${error}\n`);
			return null;
		}
	}

	async openCustomDocument(uri: Uri) {
		return BinaryDocument.create(uri);
	}

	dispose() {
		// nothing to dispose yet
	}
}
