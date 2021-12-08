import type { Decoder } from './type';

const decoder: Decoder = (data) =>
	[...data].map((byte) => {
		if (byte < 0x20 || (byte >= 0x7f && byte < 0xa0)) {
			return null;
		}

		return String.fromCharCode(byte);
	});

export default decoder;
