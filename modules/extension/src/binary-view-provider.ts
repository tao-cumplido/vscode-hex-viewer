import type { CustomReadonlyEditorProvider, Disposable, ExtensionContext, Webview, WebviewPanel } from 'vscode';
import { window, Uri } from 'vscode';

import { BinaryDocument } from './binary-document';
import { defaultDecoder } from './decoders';
import { state, ViewState } from './state';

const viewStates = new WeakMap<Webview, ViewState>();

export class BinaryViewProvider implements CustomReadonlyEditorProvider<BinaryDocument> {
	private static readonly viewType = 'hexViewer.binary';

	static register(context: ExtensionContext): Disposable {
		return window.registerCustomEditorProvider(BinaryViewProvider.viewType, new BinaryViewProvider(context), {
			webviewOptions: {
				retainContextWhenHidden: true,
			},
		});
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
			'node_modules/@vscode/webview-ui-toolkit/dist/toolkit.min.js',
		);
		const scriptUri = this.webviewUri(webviewPanel.webview, 'dist/editor/index.js');
		const styleUri = this.webviewUri(webviewPanel.webview, 'dist/editor/index.css');

		webviewPanel.webview.html = /* html */ `
			<!doctype html>
			<html lang="en">
				<head>
					<meta charset="UTF-8" />
					<title>Hex-View</title>
					<script type="module" src="${vscodeUiToolkitUri}"></script>
					<script type="module" crossorigin src="${scriptUri}"></script>
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
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const currentView = viewStates.get(webviewPanel.webview)!;

			if (webviewPanel.visible) {
				state.visibleViews.add(currentView);
			} else {
				state.visibleViews.delete(currentView);
			}

			if (webviewPanel.active) {
				state.activeView = currentView;
				state.activeDecoderStatusItem.text = state.activeView.decoderItem.label;
				state.activeDecoderStatusItem.show();
			} else if (state.activeView === currentView) {
				state.activeView = null;
				state.activeDecoderStatusItem.hide();
			}
		});

		const viewState = new ViewState(webviewPanel.webview, document, defaultDecoder);

		state.allViews.add(viewState);
		state.activeView = viewState;
		state.activeDecoderStatusItem.text = viewState.decoderItem.label;
		state.activeDecoderStatusItem.show();

		viewStates.set(webviewPanel.webview, viewState);

		if (webviewPanel.visible) {
			state.visibleViews.add(viewState);
		}
	}
}
