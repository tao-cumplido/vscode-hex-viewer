import type { Decoder } from './type';

function outOfRange(...values: number[]) {
	return values.some((value) => value < 0b1000_0000 || value >= 0b1100_0000);
}

const error = {
	style: {
		color: 'var(--vscode-editorError-foreground)',
	},
};

const decoder: Decoder = (data) => {
	const decoded = [];

	let offset = 0;

	while (offset < data.length) {
		const byte1 = data[offset++];

		if (typeof byte1 !== 'number') {
			break;
		}

		if (byte1 < 0x21 || byte1 === 0x7f) {
			decoded.push(null);
			continue;
		}

		if (byte1 < 0x80) {
			decoded.push(String.fromCodePoint(byte1));
			continue;
		}

		const byte2 = data[offset++];

		if (typeof byte2 !== 'number') {
			decoded.push(error);
			break;
		}

		if (byte1 < 0b1110_0000) {
			if ((byte1 >= 0x80 && byte1 < 0b1100_000) || outOfRange(byte2)) {
				decoded.push(error);
				offset--;
				continue;
			}

			decoded.push({
				text: String.fromCodePoint(((byte1 & 0b0001_1111) << 6) + (byte2 & 0b0011_1111)),
				length: 2,
			});

			continue;
		}

		const byte3 = data[offset++];

		if (typeof byte3 !== 'number') {
			decoded.push(error);
			offset -= 2;
			continue;
		}

		if (byte1 < 0b1111_0000) {
			if (outOfRange(byte2, byte3)) {
				decoded.push(error);
				offset -= 2;
				continue;
			}

			decoded.push({
				text: String.fromCodePoint(((byte1 & 0b0000_1111) << 12) + ((byte2 & 0b0011_1111) << 6) + (byte3 & 0b0011_1111)),
				length: 3,
			});

			continue;
		}

		const byte4 = data[offset++];

		if (typeof byte4 !== 'number' || byte1 >= 0b1111_1000 || outOfRange(byte2, byte3, byte4)) {
			decoded.push(error);
			offset -= 3;
			continue;
		}

		decoded.push({
			text: String.fromCodePoint(
				((byte1 & 0b0000_0111) << 18) +
					((byte2 & 0b0011_1111) << 12) +
					((byte3 & 0b0011_1111) << 6) +
					(byte4 & 0b0011_1111),
			),
			length: 4,
		});
	}

	return decoded;
};

export default decoder;
