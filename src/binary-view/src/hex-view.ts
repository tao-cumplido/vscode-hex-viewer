import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import type { DataCell } from './data-cell';
import type { OffsetCell } from './offset-cell';
import { hex } from './util';
import { vscode } from './vscode';

interface DecodedValue {
	text: string;
	length?: number;
	style?: {
		color?: string;
	};
}

interface DataMessage<T extends string, D> {
	type: T;
	data: D;
}

type HostMessage = DataMessage<'bytes', ArrayBuffer> | DataMessage<'decoded', Array<string | null | DecodedValue>>;

@customElement('hex-view')
export class HexView extends LitElement {
	static override styles = css`
		:host {
			--vscode-scrollbar-size: 10px;
			font-family: var(--vscode-editor-font-family);
			user-select: none;
			min-height: calc(100vh - var(--vscode-scrollbar-size));
			display: grid;
		}

		.decoded-spinner {
			grid-column: decode 1 / span 16;
			& > div {
				height: calc(100vh - var(--vscode-scrollbar-size) - 1.6rem);
				display: grid;
				position: sticky;
				top: 1.6rem;
			}
		}

		vscode-progress-ring {
			place-self: center;
		}

		.data-view {
			place-self: start;
			display: grid;
			grid: auto / [offset] auto 0.3rem repeat(16, [byte] auto) 1rem repeat(16, [decode] auto) [end];
		}

		.offset-columns-bg {
			grid-column: 1 / end;
			grid-row: 1 / span 1;
			position: sticky;
			top: 0;
			background: var(--vscode-editor-background);
		}

		.empty {
			color: var(--vscode-editorGhostText-foreground);
		}
	`;

	@state()
	private bytes?: number[];

	@state()
	private decoded?: Array<string | null | DecodedValue>;

	constructor() {
		super();

		vscode.postMessage('ready');

		window.addEventListener('message', ({ data: message }: MessageEvent<HostMessage>) => {
			if (message.type === 'bytes') {
				this.bytes = [...new Uint8Array(message.data)];
			} else {
				this.decoded = message.data;
			}
		});
	}

	override updated() {
		const rows = [...this.renderRoot.querySelectorAll<OffsetCell>('offset-cell[block="offset"]')];
		const byteColumns = [...this.renderRoot.querySelectorAll<OffsetCell>('offset-cell[block="byte"]')];
		const decodeColumns = [...this.renderRoot.querySelectorAll<OffsetCell>('offset-cell[block="decode"]')];
		const byteCells = [...this.renderRoot.querySelectorAll<DataCell>('data-cell[block="byte"]')];
		const decodedCells = [...this.renderRoot.querySelectorAll<DataCell>('data-cell[block="decode"]')];

		const byteMap = new Map(
			byteCells.map((cell) => {
				return [
					cell,
					{
						rows: cell.sliceRows(rows),
						columns: cell.sliceColumns(byteColumns),
						related: decodedCells.filter((other) => cell.offset >= other.offset && cell.offset < other.offset + other.length),
					},
				];
			}),
		);

		const decodedMap = new Map(
			decodedCells.map((cell) => {
				return [
					cell,
					{
						rows: cell.sliceRows(rows),
						columns: cell.sliceColumns(decodeColumns),
						related: byteCells.filter((other) => other.offset >= cell.offset && other.offset < cell.offset + cell.length),
					},
				];
			}),
		);

		for (const cell of byteCells) {
			cell.updateRelated(byteMap, decodedMap);
		}

		for (const cell of decodedCells) {
			cell.updateRelated(decodedMap, byteMap);
		}
	}

	override render() {
		if (!this.bytes) {
			return html`<vscode-progress-ring></vscode-progress-ring>`;
		}

		const hexLength = this.bytes.length.toString(16).length;
		const offsetPad = hexLength + (hexLength % 2);

		const rowOffsets = Array.from({ length: Math.ceil(this.bytes.length / 16) }).map(
			(_, index) => html`<offset-cell block="offset" .row=${index + 2}>${hex(index * 16, offsetPad)}</offset-cell>`,
		);

		const columnOffsets = Array.from({ length: 16 }).map(
			(_, index) => html`
				<offset-cell block="byte" .offset=${index}>${hex(index)}</offset-cell>
				<offset-cell block="decode" .offset=${index}>${hex(index)}</offset-cell>
			`,
		);

		const byteCells = this.bytes.map(
			(value, offset) => html`<data-cell block="byte" .offset=${offset}>${hex(value)}</data-cell>`,
		);

		if (!this.decoded) {
			return html`
				<div class="data-view">
					<div class="offset-columns-bg"></div>
					${rowOffsets} ${columnOffsets} ${byteCells}
					<div class="decoded-spinner" style="grid-row: 2 / span ${rowOffsets.length}">
						<div><vscode-progress-ring></vscode-progress-ring></div>
					</div>
				</div>
			`;
		}

		let offset = 0;

		const decodedCells = this.decoded.map((value) => {
			if (!value) {
				return html`<data-cell class="empty" block="decode" .offset=${offset++}>.</data-cell>`;
			}

			if (typeof value === 'string') {
				return html`<data-cell block="decode" .offset=${offset++}>${value}</data-cell>`;
			}

			const length = value.length ?? 1;

			const result = html`<data-cell block="decode" .offset=${offset} .length=${length} .additionalStyles=${value.style}
				>${value.text}</data-cell
			>`;

			offset += length;

			return result;
		});

		return html`
			<div class="data-view">
				<div class="offset-columns-bg"></div>
				${rowOffsets} ${columnOffsets} ${byteCells} ${decodedCells}
			</div>
		`;
	}
}
