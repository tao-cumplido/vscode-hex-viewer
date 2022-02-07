export type StyleMap = Record<string, string>;

export function y(index: number): StyleMap {
	return { '--y': `calc(${index} * var(--row-height))` };
}

export function gridColumn(block: string, offset: number, span = 1): StyleMap {
	return { 'grid-column': `${block} ${(offset % 0x10) + 1} / span ${span}` };
}
