import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { OffsetCell } from './offset-cell';
import type { Highlight, Highlightable } from './util';
import { cellStyles, gridColumn } from './util';

export interface RelationData {
	readonly rows: readonly OffsetCell[];
	readonly columns: readonly OffsetCell[];
	readonly related: readonly DataCell[];
}

@customElement('data-cell')
export class DataCell extends LitElement implements Highlightable {
	static override styles = [cellStyles];

	private readonly listeners = new Map<string, () => unknown>();

	private relatedStrong: Set<Highlightable> = new Set();
	private relatedWeak: Set<Highlightable> = new Set();

	@property()
	block = '';

	@state()
	offset = 0;

	@state()
	length = 1;

	@state()
	additionalStyles?: Record<string, string>;

	@property({ reflect: true })
	highlight: Highlight = 'off';

	private styles(offset: number, row: number, span = 1) {
		return styleMap({
			...this.additionalStyles,
			gridColumn: gridColumn(this.block, offset, span),
			gridRow: `${row} / span 1`,
		});
	}

	private highlightOn() {
		this.highlight = 'on';
		for (const element of this.relatedStrong) {
			element.highlight = 'on';
		}
		for (const element of this.relatedWeak) {
			element.highlight = 'weak';
		}
	}

	private highlightOff() {
		this.highlight = 'off';
		for (const element of [...this.relatedStrong, ...this.relatedWeak]) {
			element.highlight = 'off';
		}
	}

	sliceRows(rows: readonly OffsetCell[]): readonly OffsetCell[] {
		return rows.slice(Math.floor(this.offset / 0x10), Math.ceil((this.offset + this.length) / 0x10));
	}

	sliceColumns(columns: readonly OffsetCell[]): readonly OffsetCell[] {
		if (this.length >= 0x10) {
			return columns;
		}

		const start = this.offset % 0x10;
		const end = ((this.offset + this.length - 1) % 0x10) + 1;

		if (start < end) {
			return columns.slice(start, end);
		}

		return [...columns.slice(0, end), ...columns.slice(start)];
	}

	updateRelated(selfMap: Map<DataCell, RelationData>, otherMap: Map<DataCell, RelationData>): void {
		const selfData = selfMap.get(this);

		if (!selfData) {
			return;
		}

		this.relatedStrong = new Set([
			...selfData.rows,
			...selfData.columns,
			...selfData.related,
			...selfData.related.flatMap((cell) => otherMap.get(cell)?.columns ?? []),
		]);

		this.relatedWeak = new Set(
			selfData.related
				.flatMap((cell) => {
					const otherData = otherMap.get(cell);

					if (!otherData) {
						return [];
					}

					return [
						...otherData.rows,
						...otherData.related,
						...otherData.related.flatMap((relatedSelf) => selfMap.get(relatedSelf)?.columns ?? []),
					];
				})
				.filter((cell) => cell !== this && !this.relatedStrong.has(cell)),
		);
	}

	override render() {
		const column = this.offset % 0x10;

		let row = Math.floor(this.offset / 0x10) + 2;

		if (column + this.length > 0x10) {
			const start = (-column + 0x10) % 0x10;
			const end = (this.offset + this.length) % 0x10;

			return html`
				<span style=${this.styles(this.offset, row++, start)}><slot></slot></span>
				${Array.from({ length: (this.length - start - end) / 0x10 }).map(
					() => html`<span style=${this.styles(0, row++, 0x10)}></span>`,
				)}
				<span style=${this.styles(0, row, end)}></span>
			`;
		}

		return html` <span style=${this.styles(this.offset, row, this.length)}><slot></slot></span> `;
	}

	override connectedCallback() {
		super.connectedCallback();

		this.listeners.set('mouseenter', () => this.highlightOn());
		this.listeners.set('mouseleave', () => this.highlightOff());

		this.listeners.forEach((listener, event) => this.addEventListener(event, listener));
	}

	override disconnectedCallback() {
		super.disconnectedCallback();
		this.listeners.forEach((listener, event) => this.removeEventListener(event, listener));
	}
}
