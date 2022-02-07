/* eslint-disable @typescript-eslint/consistent-type-imports */

import type { FromSchema } from 'json-schema-to-ts';

type Schemas = typeof import('./schema').schemas;

type Module = {
	// @ts-expect-error
	[P in keyof Schemas as `is${Capitalize<P>}`]: (value: unknown) => value is FromSchema<Schemas[P]>;
};

declare namespace module {
	export type DecoderResult = FromSchema<Schemas['decoderResult']>;

	// eslint-disable-next-line @typescript-eslint/ban-types
	export type PotentialDecoder = Function;

	export type RenderControlCharacters = 'hex' | 'abbreviation' | 'escape' | 'caret' | 'picture';

	export interface DecoderConfig {
		readonly fileUri: string;
		readonly settings: {
			readonly renderControlCharacters: 'off' | RenderControlCharacters | RenderControlCharacters[];
		};
	}

	export type Decoder = (data: Uint8Array, config: DecoderConfig) => DecoderResult;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
declare const module: Module;

export = module;
