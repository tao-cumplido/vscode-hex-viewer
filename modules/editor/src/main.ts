/* eslint-disable @typescript-eslint/no-confusing-void-expression */

import './style.css';

import type { DecoderResult } from '@hex/types';

import { handleByteData } from './handle-byte-data';
import { handleTextData } from './handle-text-data';
import { render } from './render';
import { header, headerItems, updateRowHeight } from './state';
import { vscode } from './vscode';

interface DataMessage<T extends string, D> {
	type: T;
	data: D;
}

type HostMessage = DataMessage<'bytes', ArrayBuffer> | DataMessage<'text', null | DecoderResult>;

header.append(...headerItems.flatMap(({ byte, text }) => [byte, text]));

updateRowHeight();

window.addEventListener('scroll', render);

window.addEventListener('message', ({ data: message }: MessageEvent<HostMessage>) => {
	switch (message.type) {
		case 'bytes':
			return handleByteData(message.data);
		case 'text':
			return handleTextData(message.data);
	}
});

vscode.postMessage('ready');
