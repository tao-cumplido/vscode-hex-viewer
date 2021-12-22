import type { QuickPickItem } from 'vscode';

import type { PotentialDecoder } from './type';
import iso88591 from './iso-8859-1';
import utf8 from './utf-8';
import utf16 from './utf-16';

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
	{
		label: 'UTF-16 BE',
		decoder: utf16(false),
	},
	{
		label: 'UTF-16 LE',
		decoder: utf16(true),
	},
];
