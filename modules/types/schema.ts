const decodedValue = {
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
			additionalProperties: false,
		},
	],
} as const;

const decoderResult = {
	type: 'array',
	items: decodedValue,
} as const;

export const schemas = {
	decodedValue,
	decoderResult,
} as const;
