/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { HostMessageMap } from '@hex/types';

import { createElement } from './create-element';
import { hex } from './hex';
import { throttledRender } from './render';
import { byteRelations, data, flags, headerItems, listeners, stat, textRelations } from './state';
import { gridColumn, y } from './style';

export function handleByteData({ offset, buffer }: HostMessageMap['bytes']): void {
	flags.fetchInProgress = false;

	const bytes = new Uint8Array(buffer);

	listeners.forEach((listener, element) => {
		listener.forEach((callback, event) => element.removeEventListener(event, callback));
	});

	byteRelations.clear();
	textRelations.clear();

	data.offset = offset;
	data.byteLength = bytes.byteLength;
	data.rows = [];

	const dataStartIndex = data.offset / 0x10;

	bytes.forEach((byte, byteIndex) => {
		const byteOffset = offset + byteIndex;
		const columnIndex = byteOffset % 0x10;
		const rowIndex = Math.floor(byteOffset / 0x10);

		const row = data.rows[rowIndex - dataStartIndex] ?? {
			offset: createElement('div', {
				classList: ['cell', 'offset'],
				style: y(rowIndex),
				content: hex(rowIndex * 0x10, stat.offsetHexDigitCount),
			}),
			bytes: [],
			text: [],
		};

		data.rows[rowIndex - dataStartIndex] = row;

		const cell = createElement('div', {
			classList: ['cell'],
			style: {
				...y(rowIndex),
				...gridColumn('byte', byteOffset),
			},
			content: hex(byte),
		});

		const listener = new Map<string, () => unknown>();

		listener.set('mouseenter', () => {
			const relations = byteRelations.get(cell)!;

			relations.weak.forEach((element) => {
				element.classList.add('shadow');
			});

			[cell, relations.row, relations.column, ...relations.text.columns, ...relations.text.unit].forEach((element) => {
				element.classList.add('highlight');
			});
		});

		listener.set('mouseleave', () => {
			const relations = byteRelations.get(cell)!;

			relations.weak.forEach((element) => {
				element.classList.remove('shadow');
			});

			[cell, relations.row, relations.column, ...relations.text.columns, ...relations.text.unit].forEach((element) => {
				element.classList.remove('highlight');
			});
		});

		listener.set('mousedown', () => {
			const relations = byteRelations.get(cell)!;

			cell.classList.toggle('selected');

			relations.text.unit.forEach((element) => {
				const textRelation = textRelations.get(element)!;

				const selected = textRelation.bytes.some((byteCell) => byteCell.classList.contains('selected'));

				if (selected) {
					element.classList.add('selected');
				} else {
					element.classList.remove('selected');
				}
			});
		});

		listener.forEach((callback, event) => cell.addEventListener(event, callback));

		listeners.set(cell, listener);

		byteRelations.set(cell, {
			row: row.offset,
			column: headerItems[columnIndex]!.byte,
			weak: [],
			text: {
				columns: [],
				unit: [],
			},
		});

		row.bytes.push(cell);
	});

	headerItems.forEach(({ byte, text }) => {
		byte.classList.remove('highlight');
		text.classList.remove('highlight');
	});

	throttledRender();
}
