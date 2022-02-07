/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createElement } from './create-element';
import { hex } from './hex';
import { byteRelations, dataRows, headerItems, listeners, renderRows, textRelations } from './init';
import { gridColumn, y } from './style';

export function handleByteData(data: ArrayBuffer): void {
	const bytes = new Uint8Array(data);

	const hexLength = bytes.length.toString(16).length;
	const offsetPad = hexLength + (hexLength % 2);

	listeners.forEach((listener, element) => {
		listener.forEach((callback, event) => element.removeEventListener(event, callback));
	});

	byteRelations.clear();
	textRelations.clear();

	bytes.forEach((byte, offset) => {
		const column = offset % 0x10;
		const index = Math.floor(offset / 0x10);

		const row = dataRows[index] ?? {
			offset: createElement('div', {
				classList: ['cell', 'offset'],
				style: y(index),
				content: hex(index * 0x10, offsetPad),
			}),
			bytes: [],
			text: [],
		};

		dataRows[index] = row;

		const cell = createElement('div', {
			classList: ['cell'],
			style: {
				...y(index),
				...gridColumn('byte', offset),
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
			column: headerItems[column]!.byte,
			weak: [],
			text: {
				columns: [],
				unit: [],
			},
		});

		row.bytes.push(cell);
	});

	renderRows();
}
