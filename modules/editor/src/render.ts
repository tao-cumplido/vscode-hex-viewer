import { createElement } from './create-element';
import { hex } from './hex';
import { contentHeight, data, progress, resetData, rowHeight, scrollFactorY, stat, viewportHeight } from './state';
import { gridColumn } from './style';
import { vscode } from './vscode';

let debounceTimer = 0;
let lastFirstRendered: number | null = null;

export function render(): void {
	const maxVisibleRows = Math.ceil(viewportHeight / rowHeight);
	const firstVisibleRow = Math.floor((scrollFactorY * contentHeight) / rowHeight);

	if (
		lastFirstRendered === null ||
		firstVisibleRow >= lastFirstRendered + maxVisibleRows ||
		firstVisibleRow <= lastFirstRendered - maxVisibleRows
	) {
		const overscrollRows = 2 * maxVisibleRows;

		const renderStartIndex = Math.max(0, firstVisibleRow - overscrollRows);
		const renderEndIndex = Math.min(stat.fileRows, firstVisibleRow + maxVisibleRows + overscrollRows);
		const renderStartOffset = renderStartIndex * 0x10;
		const renderEndOffset = renderEndIndex * 0x10;
		const renderByteLength = renderEndOffset - renderStartOffset;

		lastFirstRendered = firstVisibleRow;

		resetData();

		const headerFragment = document.createDocumentFragment();
		const placeholdersFragment = document.createDocumentFragment();

		for (let rowIndex = renderStartIndex; rowIndex < renderEndIndex; rowIndex++) {
			const cell = createElement('div', {
				classList: ['cell', 'offset'],
				style: {
					'--row-index': `${rowIndex}`,
				},
				content: hex(rowIndex * 0x10, stat.offsetHexDigitCount),
			});

			data.rows.set(rowIndex, { offset: cell, bytes: [], text: [] });

			headerFragment.appendChild(cell);

			for (let i = 0; stat.fileRows - 1 === rowIndex ? i < stat.fileSize % 0x10 : i < 0x10; i++) {
				placeholdersFragment.appendChild(
					createElement('div', {
						style: {
							'--row-index': `${rowIndex}`,
							...gridColumn('byte', i),
						},
						content: createElement('div'),
					}),
				);
				placeholdersFragment.appendChild(
					createElement('div', {
						style: {
							'--row-index': `${rowIndex}`,
							...gridColumn('text', i),
						},
						content: createElement('div'),
					}),
				);
			}
		}

		data.header.appendChild(headerFragment);
		data.placeholders.appendChild(placeholdersFragment);

		clearTimeout(debounceTimer);

		debounceTimer = setTimeout(() => {
			progress.style.visibility = 'visible';
			vscode.postMessage({ type: 'fetchBytes', data: { offset: renderStartOffset, byteLength: renderByteLength } });
		}, 250);
	}
}
