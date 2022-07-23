import { content, data, flags, rowHeight, stat } from './state';
import { throttle } from './throttle';
import { vscode } from './vscode';

const overscrollFactor = 1;

export function render(): void {
	const { scrollTop, clientHeight: viewportHeight } = document.documentElement;
	const maxRows = Math.ceil(stat.fileSize / 0x10);
	const maxVisibleRows = Math.ceil(viewportHeight / rowHeight);
	const firstVisibleRow = Math.floor(scrollTop / rowHeight);
	const overscrollRows = Math.max(10, Math.ceil(maxVisibleRows * overscrollFactor));

	const renderStartIndex = Math.max(0, firstVisibleRow - overscrollRows);
	const renderEndIndex = Math.min(maxRows, renderStartIndex + maxVisibleRows + 2 * overscrollRows);
	const renderStartOffset = renderStartIndex * 0x10;
	const renderEndOffset = renderEndIndex * 0x10;
	const renderByteLength = renderEndOffset - renderStartOffset;

	if (!flags.fetchInProgress && (renderStartOffset !== data.offset || renderByteLength !== data.byteLength)) {
		flags.fetchInProgress = true;
		vscode.postMessage({ type: 'fetch', data: { offset: renderStartOffset, byteLength: renderByteLength } });
	}

	const dataStartIndex = data.offset / 0x10;

	content.replaceChildren(
		...data.rows
			.slice(renderStartIndex - dataStartIndex, renderEndIndex - dataStartIndex)
			.flatMap(({ offset, bytes, text }) => [offset, ...bytes, ...text]),
	);
}

export const throttledRender = throttle(render, 250);
