import type { CustomReadonlyEditorProvider, Disposable, ExtensionContext, Webview, WebviewPanel } from 'vscode';
import { window, Uri } from 'vscode';

import { BinaryDocument } from './binary-document';
import { defaultDecoder } from './decoders';
import { state, ViewState } from './state';

const viewStates = new WeakMap<Webview, ViewState>();

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
		const styleUri = this.webviewUri(webviewPanel.webview, 'dist/src/binary-view/index.css');

		webviewPanel.webview.html = /* html */ `
			<!doctype html>
			<html lang="en">
				<head>
					<meta charset="UTF-8" />
					<title>Hex-View</title>
					<script type="module" src="${vscodeUiToolkitUri}"></script>
					<script type="module" crossorigin src="${scriptUri}"></script>
					<link rel="modulepreload" href="${vendorUri}">
					<link rel="stylesheet" href="${styleUri}">
				</head>
				<body>
					<header>
						<div class="background"></div>
						<div class="progress">
							<vscode-progress-ring></vscode-progress-ring>
						</div>
					</header>
					<main></main>
				</body>
			</html>
		`;

		webviewPanel.onDidChangeViewState(() => {
			const currentView = viewStates.get(webviewPanel.webview);

			if (webviewPanel.active && currentView) {
				state.activeView = currentView;
			} else {
				state.activeView = null;
			}

			if (currentView) {
				if (webviewPanel.visible) {
					state.visibleViews.add(currentView);
				} else {
					state.visibleViews.delete(currentView);
				}
			}

			if (state.activeView) {
				state.activeDecoderStatusItem.text = state.activeView.decoderItem.label;
				state.activeDecoderStatusItem.show();
			} else {
				state.activeDecoderStatusItem.hide();
			}
		});

		const viewState = new ViewState(webviewPanel.webview, document, defaultDecoder);

		state.allViews.add(viewState);
		state.activeView = viewState;
		state.activeDecoderStatusItem.text = viewState.decoderItem.label;
		state.activeDecoderStatusItem.show();
		viewStates.set(webviewPanel.webview, viewState);
	}
}
