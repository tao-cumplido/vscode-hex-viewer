import type { Decoder } from './type';

export const decoder: Decoder = (data) =>
	[...data].map((byte) => {
		if (byte < 0x20 || (byte >= 0x7f && byte < 0xa0)) {
			return null;
		}

		switch (byte) {
			case 0x20:
				return { text: 'SP', color: 'var(--vscode-tab-unfocusedInactiveForeground)' };
			case 0xa0:
				return { text: 'NBSP', color: 'var(--vscode-tab-unfocusedInactiveForeground)' };
			case 0xad:
				return { text: 'SHY', color: 'var(--vscode-tab-unfocusedInactiveForeground)' };
		}

		return String.fromCharCode(byte);
	});
