import type { Uri } from 'vscode';
import { workspace } from 'vscode';

import { AbstractDocument } from './abstract-document';

export class BinaryDocument extends AbstractDocument<undefined> {
	static async create(uri: Uri): Promise<BinaryDocument> {
		return new BinaryDocument(uri, await workspace.fs.readFile(uri));
	}

	readonly data;

	private constructor(uri: Uri, data: Uint8Array) {
		super(uri, data.byteLength, undefined);
		this.data = data;
	}

	read(offset: number, byteLength: number): Uint8Array {
		return this.data.slice(offset, offset + byteLength);
	}
}
