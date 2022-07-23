/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { ByteRelation, Data, Flags, HeaderItem, Stat, TextRelation } from './types';
import { createElement } from './create-element';
import { hex } from './hex';
import { gridColumn } from './style';

export const header = document.querySelector('header')!;
export const content = document.querySelector('main')!;
export const progress = document.querySelector<HTMLElement>('.progress')!;

export const flags: Flags = {
	fetchInProgress: false,
};

export const stat: Stat = {
	fileSize: 0,
	fileRows: 0,
	offsetHexDigitCount: 0,
};

export const data: Data = {
	offset: 0,
	byteLength: 0,
	rows: [],
};

export const byteRelations = new Map<HTMLElement, ByteRelation>();
export const textRelations = new Map<HTMLElement, TextRelation>();

export const listeners = new Map<HTMLElement, Map<string, () => unknown>>();

export const headerOffsetSpacer = createElement('div', {
	classList: ['spacer', 'cell'],
});

export const headerItems: HeaderItem[] = Array.from({ length: 0x10 }).map((_, index) => {
	return {
		byte: createElement('div', {
			classList: ['cell', 'offset'],
			style: gridColumn('byte', index),
			content: hex(index),
		}),
		text: createElement('div', {
			classList: ['cell', 'offset'],
			style: gridColumn('text', index),
			content: hex(index),
		}),
	};
});

export let rowHeight = 0;

export function updateRowHeight(): void {
	const div = createElement('div', {
		style: {
			height: `var(--row-height)`,
		},
	});

	document.body.appendChild(div);

	rowHeight = div.getBoundingClientRect().height;

	document.body.removeChild(div);
}
