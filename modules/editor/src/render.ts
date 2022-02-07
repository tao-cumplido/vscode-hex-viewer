import { content, dataRows, rowHeight } from './state';

export function render(): void {
	const aheadRows = 20;
	const viewportHeight = document.documentElement.clientHeight;

	const start = Math.max(0, Math.floor(document.documentElement.scrollTop / rowHeight) - aheadRows);
	const end = Math.min(dataRows.length, start + Math.ceil(viewportHeight / rowHeight) + 2 * aheadRows);

	document.body.style.height = `calc(${dataRows.length + 1} * var(--row-height))`;

	content.replaceChildren(
		...dataRows.slice(start, end).flatMap(({ offset, bytes, text }) => [offset, ...bytes, ...text]),
	);
}
