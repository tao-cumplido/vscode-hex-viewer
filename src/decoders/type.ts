import type { FromSchema } from 'json-schema-to-ts';
import Ajv from 'ajv';

const ajv = new Ajv({ validateSchema: false });

const decodedValueSchema = {
	oneOf: [
		{
			type: ['string', 'null'],
		},
		{
			type: 'object',
			properties: {
				text: {
					type: 'string',
				},
				length: {
					type: 'integer',
					minimum: 1,
				},
				style: {
					type: 'object',
					properties: {
						color: {
							type: 'string',
						},
					},
					additionalProperties: false,
				},
			},
			required: ['text'],
			additionalProperties: false,
		},
	],
} as const;

const decoderResultSchema = {
	type: 'array',
	items: decodedValueSchema,
} as const;

export type DecoderResult = FromSchema<typeof decoderResultSchema>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type PotentialDecoder = Function;

export type Decoder = (data: Uint8Array) => DecoderResult;

export function isDecoderResult(value: unknown): value is DecoderResult {
	return ajv.validate(decoderResultSchema, value);
}
