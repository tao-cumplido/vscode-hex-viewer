import type { HostMessageMap } from '@hex/types';

import { assert } from './assert';
import { createElement } from './create-element';
import { hex } from './hex';
import { data, headerItems } from './state';
import { gridColumn } from './style';
import { vscode } from './vscode';

export function handleByteData({ offset, buffer }: HostMessageMap['bytes']): void {
	const bytes = new Uint8Array(buffer);

	for (const { byte, text } of headerItems) {
		byte.classList.remove('highlight');
		text.classList.remove('highlight');
	}

	const fragment = document.createDocumentFragment();

	const { byteRelations, textRelations } = data;

	for (let byteIndex = 0; byteIndex < bytes.length; byteIndex++) {
		const byteOffset = offset + byteIndex;
		const rowIndex = Math.floor(byteOffset / 0x10);
		const row = data.rows.get(rowIndex);

		if (!row?.offset) {
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const byte = bytes[byteIndex]!;
		const columnIndex = byteOffset % 0x10;

		const cell = createElement('div', {
			classList: ['cell'],
			style: {
				'--row-index': `${rowIndex}`,
				...gridColumn('byte', byteOffset),
			},
			content: hex(byte),
		});

		row.bytes.push(cell);
		fragment.appendChild(cell);

		const listener = new Map<string, () => unknown>();

		listener.set('mouseenter', () => {
			const relations = assert.return(byteRelations.get(cell));

			for (const element of relations.weak) {
				element.classList.add('shadow');
			}

			for (const element of [cell, relations.row, relations.column, ...relations.text.columns, ...relations.text.unit]) {
				element.classList.add('highlight');
			}
		});

		listener.set('mouseleave', () => {
			const relations = assert.return(byteRelations.get(cell));

			for (const element of relations.weak) {
				element.classList.remove('shadow');
			}

			for (const element of [cell, relations.row, relations.column, ...relations.text.columns, ...relations.text.unit]) {
				element.classList.remove('highlight');
			}
		});

		listener.set('mousedown', () => {
			const relations = assert.return(byteRelations.get(cell));

			cell.classList.toggle('selected');

			for (const element of relations.text.unit) {
				const textRelation = assert.return(textRelations.get(element));

				const selected = textRelation.bytes.some((byteCell) => byteCell.classList.contains('selected'));

				if (selected) {
					element.classList.add('selected');
				} else {
					element.classList.remove('selected');
				}
			}
		});

		for (const [event, callback] of listener) {
			cell.addEventListener(event, callback);
		}

		data.listeners.set(cell, listener);

		data.byteRelations.set(cell, {
			row: row.offset,
			column: assert.return(headerItems[columnIndex]).byte,
			weak: [],
			text: {
				columns: [],
				unit: [],
			},
		});
	}

	vscode.postMessage({ type: 'fetchText' });

	data.bytesSection.appendChild(fragment);
}
