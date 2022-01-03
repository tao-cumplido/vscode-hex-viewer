import type { Decoder } from '@hex/types';

const error = (length: number) => ({
	length,
	style: {
		color: 'var(--vscode-editorError-foreground)',
	},
});

const factory =
	(littleEndian: boolean): Decoder =>
	(data) => {
		const empty = Symbol();
		const last = Symbol();

		let offset = 0;

		const next = () => {
			const bytes = data.slice(offset++, ++offset);

			if (bytes.length === 0) {
				return empty;
			}

			if (bytes.length === 1) {
				return last;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return littleEndian ? (bytes[1]! << 8) + bytes[0]! : (bytes[0]! << 8) + bytes[1]!;
		};

		const decoded = [];

		while (offset < data.length) {
			let length = 2;

			let codePoint = next();

			if (typeof codePoint === 'symbol') {
				if (codePoint === last) {
					decoded.push(error(1));
				}
				break;
			}

			if (codePoint < 0x21 || codePoint === 0x7f) {
				decoded.push({ length });
				continue;
			}

			if (codePoint >= 0xd800 && codePoint < 0xe000) {
				if (codePoint >= 0xdc00) {
					decoded.push(error(2));
					continue;
				}

				const [high, low] = [codePoint, next()];

				if (typeof low === 'symbol') {
					decoded.push(error(2));
					if (low === last) {
						decoded.push(error(1));
					}
					break;
				}

				if (low < 0xdc00 || low >= 0xe000) {
					decoded.push(error(2), error(2));
					continue;
				}

				codePoint = (high - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000;
				length = 4;
			}

			decoded.push({
				text: String.fromCodePoint(codePoint),
				length,
			});
		}

		return decoded;
	};

export default factory;
