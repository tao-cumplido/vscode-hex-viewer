export interface CreateElementData {
	classList?: string[];
	style?: Record<string, string>;
	content?: string | Element;
}

export function createElement<T extends keyof HTMLElementTagNameMap>(
	name: T,
	data?: CreateElementData,
): HTMLElementTagNameMap[T] {
	const element = document.createElement(name);

	if (data?.classList) {
		element.classList.add(...data.classList.filter(Boolean));
	}

	if (data?.style) {
		Object.entries(data.style).forEach(([property, value]) => {
			element.style.setProperty(property, value);
		});
	}

	if (typeof data?.content === 'string') {
		element.textContent = data.content;
	} else if (data?.content) {
		element.appendChild(data.content);
	}

	return element;
}

export function hex(value: number, pad = 2): string {
	return value.toString(16).padStart(pad, '0');
}
