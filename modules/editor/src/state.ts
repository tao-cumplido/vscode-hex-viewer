/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { ByteRelations, DataRow, HeaderItem, TextRelations } from './types';
import { createElement } from './create-element';
import { hex } from './hex';

export const header = document.querySelector('header')!;
export const content = document.querySelector('main')!;
export const progress = document.querySelector<HTMLElement>('.progress')!;

export const dataRows: DataRow[] = [];
export const byteRelations = new Map<HTMLElement, ByteRelations>();
export const textRelations = new Map<HTMLElement, TextRelations>();
export const listeners = new Map<HTMLElement, Map<string, () => unknown>>();

export const headerItems: HeaderItem[] = Array.from({ length: 0x10 }).map((_, index) => {
	return {
		byte: createElement('div', {
			classList: ['cell', 'offset'],
			style: {
				'grid-column': `byte ${index + 1} / span 1`,
			},
			content: hex(index),
		}),
		text: createElement('div', {
			classList: ['cell', 'offset'],
			style: {
				'grid-column': `text ${index + 1} / span 1`,
			},
			content: hex(index),
		}),
	};
});

export let rowHeight = 0;

export function updateRowHeight(): void {
	/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
	// @ts-expect-error
	const styleMap = document.body.computedStyleMap();
	// @ts-expect-error
	const rowHeightEm = CSSNumericValue.parse(styleMap.get('--row-height'));
	const fontSize = styleMap.get('font-size');
	rowHeight = rowHeightEm.value * fontSize.value;
	/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
}
