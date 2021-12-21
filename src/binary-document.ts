import type { CustomDocument, Uri } from 'vscode';
import { window, workspace } from 'vscode';

import type { DecoderResult, PotentialDecoder } from './decoders';
import { isDecoderResult } from './decoders';
import { output } from './output';
import { state } from './state';

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
			const result: unknown = decoder(this.data, {
				fileUri: this.uri.toString(),
			});

			if (!isDecoderResult(result)) {
				// eslint-disable-next-line @typescript-eslint/no-floating-promises
				window.showErrorMessage(`Invalid decoder result.`);
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
			window.showErrorMessage(`Error while decoding data. See output for details.`);
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			output.appendLine(`${error}\n`);
			if (error instanceof Error && error.stack) {
				output.appendLine(error.stack);
			}
			return null;
		}
	}

	async openCustomDocument(uri: Uri) {
		return BinaryDocument.create(uri);
	}

	dispose() {
		if (state.activeView?.document === this) {
			state.visibleViews.delete(state.activeView);
			state.activeDecoderStatusItem.hide();
			state.activeView = null;
		}

		const thisView = [...state.allViews].find(({ document }) => document === this);

		if (thisView) {
			state.allViews.delete(thisView);
		}
	}
}
