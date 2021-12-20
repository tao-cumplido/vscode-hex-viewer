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

interface RenderRow {
	readonly offset: HTMLElement;
	readonly bytes: HTMLElement[];
	readonly text: HTMLElement[];
}

interface Relation {
	readonly byte: {
		readonly strong: HTMLElement[];
		readonly weak: HTMLElement[];
	};
	readonly text: HTMLElement[];
	readonly listeners: Map<string, () => unknown>;
}

const header = document.querySelector('header')!;
const content = document.querySelector('main')!;
const progress = document.querySelector<HTMLElement>('.progress')!;

interface HeaderItem {
	readonly byte: HTMLElement;
	readonly text: HTMLElement;
}

const headerItems: readonly HeaderItem[] = Array.from({ length: 0x10 }).map((_, index) => {
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

const renderRows: RenderRow[] = [];
const relations = new Map<HTMLElement, Relation>();

function render() {
	const aheadRows = 20;
	const viewportHeight = document.documentElement.clientHeight;

	const start = Math.max(0, Math.floor(document.documentElement.scrollTop / rowHeight) - aheadRows);
	const end = Math.min(renderRows.length, start + Math.ceil(viewportHeight / rowHeight) + 2 * aheadRows);

	document.body.style.height = `calc(${renderRows.length + 1} * var(--row-height))`;

	content.replaceChildren(
		...renderRows.slice(start, end).flatMap(({ offset, bytes, text }) => [offset, ...bytes, ...text]),
	);
}

window.addEventListener('scroll', render);

function y(index: number) {
	return `--y: calc(${index} * var(--row-height))`;
}

function gridColumn(block: string, offset: number, span = 1) {
	return `grid-column: ${block} ${(offset % 0x10) + 1} / span ${span}`;
}

function onMouseEnter(cell: HTMLElement) {
	return () => {
		const relation = relations.get(cell)!;

		[...relation.byte.strong, ...relation.text].forEach((related) => {
			related.classList.add('highlight');
		});

		relation.byte.weak.forEach((related) => {
			related.classList.add('shadow');
		});
	};
}

function onMouseLeave(cell: HTMLElement) {
	return () => {
		const relation = relations.get(cell)!;

		[...relation.byte.strong, ...relation.text].forEach((related) => {
			related.classList.remove('highlight');
		});

		relation.byte.weak.forEach((related) => {
			related.classList.remove('shadow');
		});
	};
}

function onMouseDown(cell: HTMLElement) {
	return () => {
		const relation = relations.get(cell)!;

		cell.classList.toggle('selected');

		[...relation.byte.strong, ...relation.text].forEach((related) => {
			if (related !== cell && !related.classList.contains('offset')) {
				const relatedRelation = relations.get(related)!;

				const selected = [...relatedRelation.byte.strong, ...relatedRelation.text].some(
					(other) => other !== related && !other.classList.contains('offset') && other.classList.contains('selected'),
				);

				if (selected) {
					related.classList.add('selected');
				} else {
					related.classList.remove('selected');
				}
			}
		});
	};
}

export function handleByteData(data: ArrayBuffer): void {
	const bytes = new Uint8Array(data);

	const hexLength = bytes.length.toString(16).length;
	const offsetPad = hexLength + (hexLength % 2);

	relations.clear();

	bytes.forEach((byte, offset) => {
		const column = offset % 0x10;
		const index = Math.floor(offset / 0x10);

		const row = renderRows[index] ?? {
			offset: parseDom(`<div class="cell offset" style="${y(index)}">${hex(index * 0x10, offsetPad)}</div>`),
			bytes: [],
			text: [],
		};

		renderRows[index] = row;

		const cell = parseDom(`<div class="cell" style="${y(index)}; ${gridColumn('byte', offset)}">${hex(byte)}</div>`);

		const listeners = new Map<string, () => unknown>();

		listeners.set('mouseenter', onMouseEnter(cell));
		listeners.set('mouseleave', onMouseLeave(cell));
		listeners.set('mousedown', onMouseDown(cell));

		relations.set(cell, {
			byte: {
				strong: [cell, row.offset, headerItems[column]!.byte],
				weak: [],
			},
			text: [],
			listeners,
		});

		listeners.forEach((callback, event) => cell.addEventListener(event, callback));

		row.bytes.push(cell);
	});

	render();
}

function updateTextRelations(
	rows: readonly RenderRow[],
	columns: readonly HeaderItem[],
	textCells: readonly HTMLElement[],
	byteCells: readonly HTMLElement[],
) {
	byteCells.forEach((cell, byteIndex) => {
		const relation = relations.get(cell);

		if (!relation) {
			return;
		}

		relation.byte.weak.push(
			...byteCells.filter((item) => item !== cell),
			...columns.filter((_, headerIndex) => headerIndex !== byteIndex).map(({ byte }) => byte),
			...rows.filter(({ bytes }) => !bytes.includes(cell)).map(({ offset }) => offset),
		);

		relation.text.push(...textCells, ...columns.map(({ text }) => text));
	});

	textCells.forEach((cell) => {
		const listeners = new Map<string, () => unknown>();

		listeners.set('mouseenter', onMouseEnter(cell));
		listeners.set('mouseleave', onMouseLeave(cell));
		listeners.set('mousedown', onMouseDown(cell));

		const relation: Relation = {
			byte: {
				strong: [...byteCells, ...columns.map(({ byte }) => byte)],
				weak: [],
			},
			text: [...textCells, ...columns.map(({ text }) => text), ...rows.map(({ offset }) => offset)],
			listeners,
		};

		relations.set(cell, relation);

		listeners.forEach((callback, event) => cell.addEventListener(event, callback));
	});
}

export function handleTextData(data: null | TextData[]): void {
	renderRows.forEach(({ text }) => {
		text.forEach((cell) => {
			relations.get(cell)?.listeners.forEach((callback, event) => cell.removeEventListener(event, callback));
			relations.delete(cell);
		});

		text.length = 0;
	});

	relations.forEach((relation) => {
		relation.byte.weak.length = 0;
		relation.text.length = 0;
	});

	if (data) {
		progress.style.display = 'none';

		let offset = 0;

		data.forEach((value) => {
			const column = offset % 0x10;
			const index = Math.floor(offset / 0x10);
			const row = renderRows[index]!;

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
						renderRows[i]!.text.push(cell);
					}

					cell = parseDom(`<div class="cell" style="${y(lastIndex)}; ${gridColumn('text', 0, end)}"></div>`);
					textCells.push(cell);
					renderRows[lastIndex]!.text.push(cell);

					const rows = renderRows.slice(index, lastIndex + 1);

					const headerCells =
						textCells.length > 2 ? headerItems : [...headerItems.slice(0, end), ...headerItems.slice(offset)];

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
