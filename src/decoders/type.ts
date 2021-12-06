export interface DecodedValue {
	text: string;
	length?: number;
	style?: {
		color?: string;
	};
}

export type Decoder = (data: Uint8Array) => Array<string | null | DecodedValue>;
