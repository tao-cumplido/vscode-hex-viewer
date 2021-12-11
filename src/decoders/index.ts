import type { QuickPickItem } from 'vscode';

import type { PotentialDecoder } from './type';
import iso88591 from './iso-8859-1';
import utf8 from './utf-8';

export * from './type';

export interface DecoderItem extends QuickPickItem {
	readonly decoder: PotentialDecoder;
}

export const defaultDecoder: DecoderItem = {
	label: 'ISO 8859-1',
	decoder: iso88591,
};

export const builtinDecoders: DecoderItem[] = [
	defaultDecoder,
	{
		label: 'UTF-8',
		decoder: utf8,
	},
];
