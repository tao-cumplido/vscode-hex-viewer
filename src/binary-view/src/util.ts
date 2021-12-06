import { css } from 'lit';

export type Highlight = 'on' | 'off' | 'weak';

export interface Highlightable {
	highlight: Highlight;
}

export function hex(value: number, pad = 2): string {
	return value.toString(16).padStart(pad, '0');
}

export function gridColumn(block: string, offset: number, span: number): string {
	return `${block} ${(offset % 0x10) + 1} / span ${span}`;
}

export const cellStyles = css`
	:host {
		display: contents;
	}

	:host([highlight='on']) > span {
		background: var(--vscode-editor-inactiveSelectionBackground);
	}

	:host([highlight='weak']) > span {
		background: var(--vscode-editor-hoverHighlightBackground);
	}

	span {
		padding: 0.2rem 0.3rem;
		height: 1.2rem;
	}
`;
