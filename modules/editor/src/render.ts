import { createElement } from './create-element';
import { hex } from './hex';
import { contentHeight, data, progress, resetData, rowHeight, scrollFactorY, stat, viewportHeight } from './state';
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

		const fragment = document.createDocumentFragment();

		for (let rowIndex = renderStartIndex; rowIndex < renderEndIndex; rowIndex++) {
			const cell = createElement('div', {
				classList: ['cell', 'offset'],
				style: {
					'--row-index': `${rowIndex}`,
				},
				content: hex(rowIndex * 0x10, stat.offsetHexDigitCount),
			});

			data.rows.set(rowIndex, { offset: cell, bytes: [], text: [] });

			fragment.appendChild(cell);
		}

		data.header.appendChild(fragment);

		clearTimeout(debounceTimer);

		debounceTimer = setTimeout(() => {
			progress.style.visibility = 'visible';
			vscode.postMessage({ type: 'fetchBytes', data: { offset: renderStartOffset, byteLength: renderByteLength } });
		}, 250);
	}
}
