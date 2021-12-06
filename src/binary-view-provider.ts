import type { CustomReadonlyEditorProvider, Disposable, ExtensionContext, Webview, WebviewPanel } from 'vscode';
import { window, Uri } from 'vscode';

import type { Decoder } from './decoders/type';
import { BinaryDocument } from './binary-document';
import { decoder as defaultDecoder } from './decoders/iso-8859-1';

export class BinaryViewProvider implements CustomReadonlyEditorProvider<BinaryDocument> {
	private static readonly viewType = 'hexViewer.binary';

	static register(context: ExtensionContext): Disposable {
		return window.registerCustomEditorProvider(BinaryViewProvider.viewType, new BinaryViewProvider(context));
	}

	private readonly context;

	constructor(context: ExtensionContext) {
		this.context = context;
	}

	private webviewUri(webview: Webview, ...paths: string[]) {
		return webview.asWebviewUri(Uri.joinPath(this.context.extensionUri, ...paths)).toString();
	}

	private decode(bytes: Uint8Array, decoder: Decoder): ReturnType<Decoder> {
		const result = decoder(bytes);
		const byteLength = result.reduce((n, value) => {
			if (typeof value === 'string' || value === null) {
				return n + 1;
			}

			return n + (value.length ?? 1);
		}, 0);

		if (byteLength > bytes.length) {
			return Array.from<null>({ length: bytes.length }).fill(null);
		}

		result.push(...Array.from<null>({ length: bytes.length - byteLength }).fill(null));

		return result;
	}

	async openCustomDocument(uri: Uri) {
		return BinaryDocument.create(uri);
	}

	resolveCustomEditor(document: BinaryDocument, webviewPanel: WebviewPanel) {
		webviewPanel.webview.options = {
			enableScripts: true,
		};

		const vscodeUiToolkitUri = this.webviewUri(
			webviewPanel.webview,
			'node_modules/@vscode/webview-ui-toolkit/dist/toolkit.js',
		);
		const scriptUri = this.webviewUri(webviewPanel.webview, 'dist/src/binary-view/index.js');
		const vendorUri = this.webviewUri(webviewPanel.webview, 'dist/src/binary-view/vendor.js');

		webviewPanel.webview.html = `
			<!doctype html>
			<html lang="en">
				<head>
					<meta charset="UTF-8" />
					<title>Hex-View</title>
					<script type="module" src="${vscodeUiToolkitUri}"></script>
					<script type="module" crossorigin src="${scriptUri}"></script>
					<link rel="modulepreload" href="${vendorUri}">
				</head>
				<body>
					<hex-view></hex-view>
				</body>
			</html>
		`;

		webviewPanel.webview.onDidReceiveMessage(async (message) => {
			if (message === 'ready') {
				const { buffer, byteOffset, byteLength } = document.data;
				const bytes = buffer.slice(byteOffset, byteOffset + byteLength);

				await webviewPanel.webview.postMessage({ type: 'bytes', data: bytes });

				const decoded = this.decode(document.data, defaultDecoder);

				return webviewPanel.webview.postMessage({ type: 'decoded', data: decoded });
			}
		});
	}
}
