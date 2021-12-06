import { css, html, LitElement } from 'lit';
import { styleMap } from 'lit-html/directives/style-map.js';
import { customElement, property, state } from 'lit/decorators.js';

import type { Highlight, Highlightable } from './util';
import { cellStyles, gridColumn } from './util';

@customElement('offset-cell')
export class OffsetCell extends LitElement implements Highlightable {
	static override styles = [
		cellStyles,
		css`
			:host {
				color: var(--vscode-editorLineNumber-foreground);
			}

			:host([active]) {
				color: var(--vscode-editorActiveLineNumber-foreground);
			}

			:host(:not([block='offset'])) > span {
				position: sticky;
				top: 0;
			}
		`,
	];

	@property({ type: Boolean, reflect: true })
	active = false;

	@property({ reflect: true })
	highlight: Highlight = 'off';

	@property({ reflect: true })
	block = '';

	@state()
	row = 1;

	@state()
	offset = 0;

	private get position() {
		return {
			gridColumn: gridColumn(this.block, this.offset, 1),
			gridRow: `${this.row} / span 1`,
		};
	}

	override render() {
		return html`<span style=${styleMap(this.position)}><slot></slot></span>`;
	}
}
