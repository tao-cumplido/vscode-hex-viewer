const parser = new DOMParser();

export function parseDom(html: string): HTMLElement {
	const element = parser.parseFromString(html, 'text/html').body.firstChild;

	if (!(element instanceof HTMLElement)) {
		throw new Error(`parsed string didn't result in html element`);
	}

	return element;
}

export function hex(value: number, pad = 2): string {
	return value.toString(16).padStart(pad, '0');
}
