/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { hex, parseDom } from './util';

export interface TextValue {
	text: string;
	length?: number;
	style?: {
		color?: string;
	};
}

export type TextData = null | string | TextValue;

interface DataRow {
	offset: HTMLElement;
	bytes: HTMLElement[];
	text: HTMLElement[];
}

interface ByteRelations {
	row: HTMLElement;
	column: HTMLElement;
	weak: HTMLElement[];
	text: {
		columns: HTMLElement[];
		unit: HTMLElement[];
	};
}

interface TextRelations {
	rows: HTMLElement[];
	columns: HTMLElement[];
	bytes: HTMLElement[];
	text: HTMLElement[];
}

const header = document.querySelector('header')!;
const content = document.querySelector('main')!;
const progress = document.querySelector<HTMLElement>('.progress')!;

interface HeaderItem {
	byte: HTMLElement;
	text: HTMLElement;
}

const headerItems: HeaderItem[] = Array.from({ length: 0x10 }).map((_, index) => {
	return {
		byte: parseDom(`<div class="cell offset" style="grid-column: byte ${index + 1} / span 1">${hex(index)}</div>`),
		text: parseDom(`<div class="cell offset" style="grid-column: text ${index + 1} / span 1">${hex(index)}</div>`),
	};
});

header.append(...headerItems.flatMap(({ byte, text }) => [byte, text]));

let rowHeight = 0;

function updateRowHeight() {
	/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
	// @ts-expect-error
	const styleMap = document.body.computedStyleMap();
	// @ts-expect-error
	const rowHeightEm = CSSNumericValue.parse(styleMap.get('--row-height'));
	const fontSize = styleMap.get('font-size');
	rowHeight = rowHeightEm.value * fontSize.value;
	/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
}

updateRowHeight();

const dataRows: DataRow[] = [];
// const relations = new Map<HTMLElement, Relation>();
const byteRelations = new Map<HTMLElement, ByteRelations>();
const textRelations = new Map<HTMLElement, TextRelations>();
const listeners = new Map<HTMLElement, Map<string, () => unknown>>();

function render() {
	const aheadRows = 20;
	const viewportHeight = document.documentElement.clientHeight;

	const start = Math.max(0, Math.floor(document.documentElement.scrollTop / rowHeight) - aheadRows);
	const end = Math.min(dataRows.length, start + Math.ceil(viewportHeight / rowHeight) + 2 * aheadRows);

	document.body.style.height = `calc(${dataRows.length + 1} * var(--row-height))`;

	content.replaceChildren(
		...dataRows.slice(start, end).flatMap(({ offset, bytes, text }) => [offset, ...bytes, ...text]),
	);
}

window.addEventListener('scroll', render);

function y(index: number) {
	return `--y: calc(${index} * var(--row-height))`;
}

function gridColumn(block: string, offset: number, span = 1) {
	return `grid-column: ${block} ${(offset % 0x10) + 1} / span ${span}`;
}

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
			offset: parseDom(`<div class="cell offset" style="${y(index)}">${hex(index * 0x10, offsetPad)}</div>`),
			bytes: [],
			text: [],
		};

		dataRows[index] = row;

		const cell = parseDom(`<div class="cell" style="${y(index)}; ${gridColumn('byte', offset)}">${hex(byte)}</div>`);

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

	render();
}

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

export function handleTextData(data: null | TextData[]): void {
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
				const cell = parseDom(
					`<div class="${value ? '' : 'empty '}cell" style="${y(index)}; ${gridColumn('text', offset++)}">${
						// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
						value || '.'
					}</div>`,
				);

				updateTextRelations([row], [headerItems[column]!], [cell], [row.bytes[column]!]);

				row.text.push(cell);
			} else {
				const length = value.length ?? 1;

				const additionalStyles = value.style?.color ? `color: ${value.style.color}` : '';

				if (column + length > 0x10) {
					const start = (-column + 0x10) % 0x10;
					const end = (offset + length) % 0x10;

					const lastIndex = index + 1 + (length - start - end) / 0x10;

					const textCells: HTMLElement[] = [];

					let cell = parseDom(
						`<div class="cell" style="${y(index)}; ${gridColumn('text', offset, start)}; ${additionalStyles}">${
							value.text
						}</div>`,
					);

					textCells.push(cell);
					row.text.push(cell);

					for (let i = index + 1; i < lastIndex; i++) {
						cell = parseDom(`<div class="cell" style="${y(i)}; ${gridColumn('text', 0, 0x10)}"></div>`);
						textCells.push(cell);
						dataRows[i]!.text.push(cell);
					}

					cell = parseDom(`<div class="cell" style="${y(lastIndex)}; ${gridColumn('text', 0, end)}"></div>`);
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
					const cell = parseDom(
						`<div class="cell" style="${y(index)}; ${gridColumn('text', offset, length)}; ${additionalStyles}">${
							value.text
						}</div>`,
					);

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
