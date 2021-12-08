import type { Decoder } from './type';
import iso88591 from './iso-8859-1';
import utf8 from './utf-8';

/* eslint-disable @typescript-eslint/naming-convention */
export const builtinDecoders: Record<string, Decoder> = {
	'ISO 8859-1': iso88591,
	'UTF-8': utf8,
};
