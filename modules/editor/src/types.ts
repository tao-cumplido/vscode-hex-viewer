export interface DataRow {
	readonly offset: HTMLElement;
	readonly bytes: HTMLElement[];
	readonly text: HTMLElement[];
}

export interface ByteRelations {
	readonly row: HTMLElement;
	readonly column: HTMLElement;
	readonly weak: HTMLElement[];
	readonly text: {
		readonly columns: HTMLElement[];
		readonly unit: HTMLElement[];
	};
}

export interface TextRelations {
	readonly rows: readonly HTMLElement[];
	readonly columns: readonly HTMLElement[];
	readonly bytes: readonly HTMLElement[];
	readonly text: readonly HTMLElement[];
}

export interface HeaderItem {
	readonly byte: HTMLElement;
	readonly text: HTMLElement;
}
