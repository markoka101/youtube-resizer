/// <reference types="chrome" />

// Core types for layout configuration

interface BreakpointConfig {
	maxWidth: number; // Infinity allowed at runtime
	videosPerRow: number;
	shortsPerRow: number;
	sidebarWidth: string;
}

interface LayoutConfig {
	mode: 'manual' | 'adaptive';
	videosPerRow: number;
	shortsPerRow: number;
	sidebarWidth: string;
	adaptiveBreakpoints: BreakpointConfig[];
}

interface YTLayoutCustomizerNamespace {
	// Config + storage
	DEFAULT_CONFIG: LayoutConfig;
	loadConfig(): Promise<LayoutConfig>;
	saveConfig(config: LayoutConfig): Promise<void>;
	getCurrentConfig(): LayoutConfig | null;
	resetSettings(): void;

	// Helpers
	escapeHtml(value: string): string;
	serializeBreakpoints(breakpoints: BreakpointConfig[]): string;
	parseBreakpoints(text: string): BreakpointConfig[];
	addInputEnterKeyHandler(
		input: HTMLInputElement | HTMLTextAreaElement,
		onSubmit: () => void
	): void;

	// Layout (filled in by layout.ts)
	getEffectiveConfig(config: LayoutConfig): LayoutConfig;
	applyLayout(config: LayoutConfig): void;
	autoLoadConfigAndApply(): Promise<void>;

	// Dialog (filled in by dialog.ts)
	showOptionsDialog(): void;
	closeDialog(dialog: HTMLElement): void;
}

(function () {
	// Default configuration used when no stored settings exist
	const DEFAULT_CONFIG: LayoutConfig = {
		mode: 'manual',
		videosPerRow: 5,
		shortsPerRow: 6,
		sidebarWidth: '280px',
		adaptiveBreakpoints: [
			{ maxWidth: 900, videosPerRow: 4, shortsPerRow: 5, sidebarWidth: '260px' },
			{ maxWidth: 1400, videosPerRow: 5, shortsPerRow: 6, sidebarWidth: '280px' },
			{ maxWidth: Infinity, videosPerRow: 6, shortsPerRow: 7, sidebarWidth: '320px' }
		]
	};

	let currentConfig: LayoutConfig | null = null;

	function loadConfig(): Promise<LayoutConfig> {
		return new Promise((resolve) => {
			chrome.storage.local.get(['layoutConfig'], (result) => {
				const stored = (result.layoutConfig ?? {}) as Partial<LayoutConfig>;

				const config: LayoutConfig = {
					...DEFAULT_CONFIG,
					...stored,
					adaptiveBreakpoints:
						stored.adaptiveBreakpoints ?? DEFAULT_CONFIG.adaptiveBreakpoints
				};

				currentConfig = config;
				resolve(config);
			});
		});
	}

	function saveConfig(config: LayoutConfig): Promise<void> {
		currentConfig = config;
		return new Promise((resolve) => {
			chrome.storage.local.set({ layoutConfig: config }, () => resolve());
		});
	}

	function getCurrentConfig(): LayoutConfig | null {
		return currentConfig;
	}

	function resetSettings(): void {
		chrome.storage.local.remove('layoutConfig', () => {
			const styleTag = document.getElementById('yt-layout-customizer-styles');
			if (styleTag) styleTag.remove();
			globalThis.location.reload();
		});
	}

	// HTML escaping for embedding JSON into innerHTML safely
	function escapeHtml(value: string): string {
		return value
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;');
	}

	// Convert breakpoints to a JSON string friendly for user editing
	function serializeBreakpoints(breakpoints: BreakpointConfig[]): string {
		return JSON.stringify(
			breakpoints.map((bp) => ({
				...bp,
				maxWidth: bp.maxWidth === Infinity ? 'Infinity' : bp.maxWidth
			})),
			null,
			2
		);
	}

	// Parse and validate user-edited JSON breakpoints
	function parseBreakpoints(text: string): BreakpointConfig[] {
		const parsed = JSON.parse(text) as Array<{
			maxWidth?: unknown;
			videosPerRow?: unknown;
			shortsPerRow?: unknown;
			sidebarWidth?: unknown;
		}>;

		if (!Array.isArray(parsed) || parsed.length === 0) {
			throw new Error('Breakpoints must be a non-empty array.');
		}

		return parsed
			.map((bp) => {
				const maxWidthRaw: unknown = bp.maxWidth;

				let maxWidth: number;
				if (maxWidthRaw === 'Infinity') {
					maxWidth = Infinity;
				} else {
					maxWidth = Number(maxWidthRaw);
				}

				const videosPerRow = Number(bp.videosPerRow);
				const shortsPerRow = Number(bp.shortsPerRow);
				const sidebarWidth = String(bp.sidebarWidth ?? '');

				if (!Number.isFinite(maxWidth) && maxWidth !== Infinity) {
					throw new Error('Each breakpoint needs a valid maxWidth.');
				}

				if (!Number.isInteger(videosPerRow) || videosPerRow < 1) {
					throw new Error('Each breakpoint needs a valid videosPerRow.');
				}

				if (!Number.isInteger(shortsPerRow) || shortsPerRow < 1) {
					throw new Error('Each breakpoint needs a valid shortsPerRow.');
				}

				if (!sidebarWidth.trim()) {
					throw new Error('Each breakpoint needs a sidebarWidth.');
				}

				return {
					maxWidth,
					videosPerRow,
					shortsPerRow,
					sidebarWidth
				};
			})
			.sort((a, b) => a.maxWidth - b.maxWidth);
	}

	function addInputEnterKeyHandler(
		input: HTMLInputElement | HTMLTextAreaElement,
		onSubmit: () => void
	): void {
		input.addEventListener('keydown', (event: Event) => {
			const keyboardEvent = event as KeyboardEvent;

			if (keyboardEvent.key === 'Enter') {
				keyboardEvent.preventDefault();
				onSubmit();
			}
		});
	}

	// Namespace object for this file; layout.ts and dialog.ts will extend it
	const namespace: Partial<YTLayoutCustomizerNamespace> = {
		DEFAULT_CONFIG,
		loadConfig,
		saveConfig,
		getCurrentConfig,
		resetSettings,
		escapeHtml,
		serializeBreakpoints,
		parseBreakpoints,
		addInputEnterKeyHandler
	};

	// Merge into global namespace without strict global typing
	const existing = globalThis.YTLayoutCustomizer ?? ({} as YTLayoutCustomizerNamespace);

	globalThis.YTLayoutCustomizer = {
		...existing,
		...namespace
	} as YTLayoutCustomizerNamespace;
})();
