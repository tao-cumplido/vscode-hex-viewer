/* eslint-disable @typescript-eslint/no-confusing-void-expression */

import './style.css';

import type { DecoderResult } from '@hex/types';

import { handleByteData, handleTextData } from './data-view';
import { vscode } from './vscode';

interface DataMessage<T extends string, D> {
	type: T;
	data: D;
}

type HostMessage = DataMessage<'bytes', ArrayBuffer> | DataMessage<'text', null | DecoderResult>;

addEventListener('message', ({ data: message }: MessageEvent<HostMessage>) => {
	switch (message.type) {
		case 'bytes':
			return handleByteData(message.data);
		case 'text':
			return handleTextData(message.data);
	}
});

vscode.postMessage('ready');
