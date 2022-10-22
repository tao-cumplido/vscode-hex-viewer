import type { DecoderResult } from '@hex/types';

import type { DataRow, HeaderItem } from './state';
import { assert } from './assert';
import { createElement } from './create-element';
import { data, headerItems } from './state';
import { gridColumn } from './style';

function updateTextRelations(
	rows: DataRow[],
	columns: HeaderItem[],
	textCells: HTMLElement[],
	byteCells: HTMLElement[],
) {
	byteCells.forEach((cell) => {
		const relations = assert.return(data.byteRelations.get(cell));

		relations.weak.push(
			...byteCells.filter((item) => item !== cell),
			...columns.map(({ byte }) => byte),
			...rows.filter(({ bytes }) => !bytes.includes(cell)).map(({ offset }) => assert.return(offset)),
		);

		relations.text.columns.push(...columns.map(({ text }) => text));
		relations.text.unit.push(...textCells);
	});

	const { textRelations } = data;

	textCells.forEach((cell) => {
		const listener = new Map<string, () => unknown>();

		listener.set('mouseenter', () => {
			const relations = assert.return(textRelations.get(cell));

			[...relations.rows, ...relations.columns, ...relations.bytes, ...relations.text].forEach((element) => {
				element.classList.add('highlight');
			});
		});

		listener.set('mouseleave', () => {
			const relations = assert.return(textRelations.get(cell));

			[...relations.rows, ...relations.columns, ...relations.bytes, ...relations.text].forEach((element) => {
				element.classList.remove('highlight');
			});
		});

		listener.set('mousedown', () => {
			const relations = assert.return(textRelations.get(cell));

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

		data.listeners.set(cell, listener);

		data.textRelations.set(cell, {
			rows: rows.flatMap(({ offset }) => (offset ? [offset] : [])),
			columns: columns.flatMap(({ byte, text }) => [byte, text]),
			bytes: byteCells,
			text: textCells,
		});
	});
}

export function handleTextData(result: null | DecoderResult): void {
	data.textRelations.clear();

	data.byteRelations.forEach((relations) => {
		relations.weak.length = 0;
		relations.text.columns.length = 0;
		relations.text.unit.length = 0;
	});

	const fragment = document.createDocumentFragment();

	if (result) {
		const { offset: startOffset, values } = result;

		let offset = startOffset;

		values.forEach((value) => {
			const columnIndex = offset % 0x10;
			const rowIndex = Math.floor(offset / 0x10);
			const row = data.rows.get(rowIndex) ?? { bytes: [], text: [] };

			data.rows.set(rowIndex, row);

			if (typeof value === 'string' || !value) {
				const cell = createElement('div', {
					classList: ['cell', value ? '' : 'empty'],
					style: {
						'--row-index': `${rowIndex}`,
						...gridColumn('text', offset++),
					},
					content: value ?? '.',
				});

				const byteCell = row.bytes[columnIndex];

				updateTextRelations([row], [assert.return(headerItems[columnIndex])], [cell], byteCell ? [byteCell] : []);

				fragment.appendChild(cell);
			} else {
				const length = value.length ?? 1;

				if (columnIndex + length > 0x10) {
					const start = (-columnIndex + 0x10) % 0x10;
					const end = (offset + length) % 0x10;

					const lastIndex = rowIndex + 1 + (length - start - end) / 0x10;

					const textCells: HTMLElement[] = [];

					let cell = createElement('div', {
						classList: ['cell', value.text ? '' : 'empty'],
						style: {
							'--row-index': `${rowIndex}`,
							...gridColumn('text', offset, start),
							...value.style,
						},
						content: value.text ?? '.',
					});

					textCells.push(cell);
					fragment.appendChild(cell);

					for (let i = rowIndex + 1; i < lastIndex; i++) {
						cell = createElement('div', {
							classList: ['cell'],
							style: {
								'--row-index': `${i}`,
								...gridColumn('text', 0, 0x10),
							},
						});

						textCells.push(cell);
						fragment.appendChild(cell);
					}

					cell = createElement('div', {
						classList: ['cell'],
						style: {
							'--row-index': `${lastIndex}`,
							...gridColumn('text', 0, end),
						},
					});

					textCells.push(cell);
					fragment.appendChild(cell);

					const rows = [...data.rows].flatMap(([index, dataRow]) =>
						index >= rowIndex && index <= lastIndex ? [dataRow] : [],
					);

					const headerCells =
						textCells.length > 2 ? headerItems : [...headerItems.slice(0, end), ...headerItems.slice(columnIndex)];

					const byteCells = rows.flatMap(({ bytes }, rowN, source) => {
						if (rowN === 0) {
							return bytes.slice(columnIndex);
						}

						if (rowN === source.length - 1) {
							return bytes.slice(0, end);
						}

						return bytes;
					});

					updateTextRelations(rows, headerCells, textCells, byteCells);
				} else {
					const cell = createElement('div', {
						classList: ['cell', value.text ? '' : 'empty'],
						style: {
							'--row-index': `${rowIndex}`,
							...gridColumn('text', offset, length),
							...value.style,
						},
						content: value.text ?? '.',
					});

					const byteCells = row.bytes.slice(columnIndex, columnIndex + length);
					const headerCells = headerItems.slice(columnIndex, columnIndex + length);

					updateTextRelations([row], headerCells, [cell], byteCells);

					row.text.push(cell);
					fragment.appendChild(cell);
				}

				offset += length;
			}
		});
	}

	data.textSection.replaceChildren(fragment);
}
