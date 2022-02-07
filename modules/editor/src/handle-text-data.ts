/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { DecoderResult } from '@hex/types';

import type { DataRow, HeaderItem } from './types';
import { createElement } from './create-element';
import { render } from './render';
import { byteRelations, dataRows, headerItems, listeners, progress, textRelations } from './state';
import { gridColumn, y } from './style';

function updateTextRelations(
	rows: DataRow[],
	columns: HeaderItem[],
	textCells: HTMLElement[],
	byteCells: HTMLElement[],
) {
	byteCells.forEach((cell) => {
		const relations = byteRelations.get(cell)!;

		relations.weak.push(
			...byteCells.filter((item) => item !== cell),
			...columns.map(({ byte }) => byte),
			...rows.filter(({ bytes }) => !bytes.includes(cell)).map(({ offset }) => offset),
		);

		relations.text.columns.push(...columns.map(({ text }) => text));
		relations.text.unit.push(...textCells);
	});

	textCells.forEach((cell) => {
		const listener = new Map<string, () => unknown>();

		listener.set('mouseenter', () => {
			const relations = textRelations.get(cell)!;

			[...relations.rows, ...relations.columns, ...relations.bytes, ...relations.text].forEach((element) => {
				element.classList.add('highlight');
			});
		});

		listener.set('mouseleave', () => {
			const relations = textRelations.get(cell)!;

			[...relations.rows, ...relations.columns, ...relations.bytes, ...relations.text].forEach((element) => {
				element.classList.remove('highlight');
			});
		});

		listener.set('mousedown', () => {
			const relations = textRelations.get(cell)!;

			relations.text.forEach((element) => element.classList.toggle('selected'));

			relations.bytes.forEach((element) => {
				if (cell.classList.contains('selected')) {
					element.classList.add('selected');
				} else {
					element.classList.remove('selected');
				}
			});
		});

		listener.forEach((callback, event) => cell.addEventListener(event, callback));

		listeners.set(cell, listener);

		textRelations.set(cell, {
			rows: rows.map(({ offset }) => offset),
			columns: columns.flatMap(({ byte, text }) => [byte, text]),
			bytes: byteCells,
			text: textCells,
		});
	});
}

export function handleTextData(data: null | DecoderResult): void {
	dataRows.forEach(({ text }) => {
		text.forEach((cell) => {
			listeners.get(cell)?.forEach((callback, event) => cell.removeEventListener(event, callback));
		});

		text.length = 0;
	});

	textRelations.clear();

	byteRelations.forEach((relations) => {
		relations.weak.length = 0;
		relations.text.columns.length = 0;
		relations.text.unit.length = 0;
	});

	if (data) {
		progress.style.display = 'none';

		let offset = 0;

		data.forEach((value) => {
			const column = offset % 0x10;
			const index = Math.floor(offset / 0x10);
			const row = dataRows[index]!;

			if (typeof value === 'string' || !value) {
				const cell = createElement('div', {
					classList: ['cell', value ? '' : 'empty'],
					style: {
						...y(index),
						...gridColumn('text', offset++),
					},
					content: value ?? '.',
				});

				updateTextRelations([row], [headerItems[column]!], [cell], [row.bytes[column]!]);

				row.text.push(cell);
			} else {
				const length = value.length ?? 1;

				if (column + length > 0x10) {
					const start = (-column + 0x10) % 0x10;
					const end = (offset + length) % 0x10;

					const lastIndex = index + 1 + (length - start - end) / 0x10;

					const textCells: HTMLElement[] = [];

					let cell = createElement('div', {
						classList: ['cell', value.text ? '' : 'empty'],
						style: {
							...y(index),
							...gridColumn('text', offset, start),
							...value.style,
						},
						content: value.text ?? '.',
					});

					textCells.push(cell);
					row.text.push(cell);

					for (let i = index + 1; i < lastIndex; i++) {
						cell = createElement('div', {
							classList: ['cell'],
							style: {
								...y(i),
								...gridColumn('text', 0, 0x10),
							},
						});

						textCells.push(cell);
						dataRows[i]!.text.push(cell);
					}

					cell = createElement('div', {
						classList: ['cell'],
						style: {
							...y(lastIndex),
							...gridColumn('text', 0, end),
						},
					});

					textCells.push(cell);
					dataRows[lastIndex]!.text.push(cell);

					const rows = dataRows.slice(index, lastIndex + 1);

					const headerCells =
						textCells.length > 2 ? headerItems : [...headerItems.slice(0, end), ...headerItems.slice(column)];

					const byteCells = rows.flatMap(({ bytes }, rowIndex, source) => {
						if (rowIndex === 0) {
							return bytes.slice(column);
						}

						if (rowIndex === source.length - 1) {
							return bytes.slice(0, end);
						}

						return bytes;
					});

					updateTextRelations(rows, headerCells, textCells, byteCells);
				} else {
					const cell = createElement('div', {
						classList: ['cell', value.text ? '' : 'empty'],
						style: {
							...y(index),
							...gridColumn('text', offset, length),
							...value.style,
						},
						content: value.text ?? '.',
					});

					const byteCells = row.bytes.slice(column, column + length);
					const headerCells = headerItems.slice(column, column + length);

					updateTextRelations([row], headerCells, [cell], byteCells);

					row.text.push(cell);
				}

				offset += length;
			}
		});
	} else {
		progress.style.display = '';
	}

	render();
}
