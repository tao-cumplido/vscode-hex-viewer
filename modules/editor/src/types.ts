import type { HostMessageMap } from '@hex/types';

export interface DataRow {
	readonly offset: HTMLElement;
	readonly bytes: HTMLElement[];
	readonly text: HTMLElement[];
}

export interface Data {
	offset: number;
	byteLength: number;
	rows: DataRow[];
}

export type Stat = HostMessageMap['stat'] & {
	fileRows: number;
	offsetHexDigitCount: number;
};

export interface Flags {
	fetchInProgress: boolean;
}

export interface ByteRelation {
	readonly row: HTMLElement;
	readonly column: HTMLElement;
	readonly weak: HTMLElement[];
	readonly text: {
		readonly columns: HTMLElement[];
		readonly unit: HTMLElement[];
	};
}

export interface TextRelation {
	readonly rows: readonly HTMLElement[];
	readonly columns: readonly HTMLElement[];
	readonly bytes: readonly HTMLElement[];
	readonly text: readonly HTMLElement[];
}

export interface HeaderItem {
	readonly byte: HTMLElement;
	readonly text: HTMLElement;
}
