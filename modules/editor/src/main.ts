/* eslint-disable @typescript-eslint/no-confusing-void-expression */

import './style.css';

import type { HostMessage } from '@hex/types';

import { handleByteData } from './handle-byte-data';
import { hex } from './hex';
import { throttledRender } from './render';
import { header, headerItems, headerOffsetSpacer, stat, updateRowHeight } from './state';
import { vscode } from './vscode';

declare global {
	interface WindowEventMap {
		message: MessageEvent<HostMessage>;
	}
}

header.append(headerOffsetSpacer, ...headerItems.flatMap(({ byte, text }) => [byte, text]));

updateRowHeight();

window.addEventListener('scroll', throttledRender);

window.addEventListener('message', ({ data: message }) => {
	switch (message.type) {
		case 'stat': {
			const hexDigitCount = message.data.fileSize.toString(16).length;
			stat.offsetHexDigitCount = hexDigitCount + (hexDigitCount % 2);
			stat.fileSize = message.data.fileSize;
			stat.fileRows = Math.ceil(message.data.fileSize / 0x10);
			document.body.style.height = `calc(${stat.fileRows + 1} * var(--row-height))`;
			headerOffsetSpacer.textContent = hex(0, stat.offsetHexDigitCount);
			return throttledRender();
		}
		case 'bytes': {
			return handleByteData(message.data);
		}
		// case 'text':
		// 	return handleTextData(message.data);
	}
});

vscode.postMessage({ type: 'ready' });
