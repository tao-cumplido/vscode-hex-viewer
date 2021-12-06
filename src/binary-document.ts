import type { CustomDocument, Uri } from 'vscode';
import { workspace } from 'vscode';

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

	dispose() {
		// nothing to dispose yet
	}
}
