/// <reference types="chrome" />

interface BreakpointConfig {
	maxWidth: number;
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
	DEFAULT_CONFIG: LayoutConfig;
	loadConfig(): Promise<LayoutConfig>;
	saveConfig(config: LayoutConfig): Promise<void>;
	getCurrentConfig(): LayoutConfig | null;
	resetSettings(): void;

	escapeHtml(value: string): string;
	serializeBreakpoints(breakpoints: BreakpointConfig[]): string;
	parseBreakpoints(text: string): BreakpointConfig[];
	addInputEnterKeyHandler(
		input: HTMLInputElement | HTMLTextAreaElement,
		onSubmit: () => void
	): void;

	getEffectiveConfig(config: LayoutConfig): LayoutConfig;
	applyLayout(config: LayoutConfig): void;
	autoLoadConfigAndApply(): Promise<void>;

	showOptionsDialog(): void;
	closeDialog(dialog: HTMLElement): void;
}

declare global {
	var YTLayoutCustomizer: YTLayoutCustomizerNamespace;
	var hasYTCustomizerLoaded: boolean | undefined;
	var __ytLayoutCustomizerHasResizeHandler: boolean | undefined;
}

export {};
