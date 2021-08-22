import { OutlineFilter } from 'pixi-filters';
import type { IBitmapTextStyle } from 'pixi.js';

export const fontLog: Partial<IBitmapTextStyle> = {
	fontName: 'fontfnt',
	fontSize: 12,
	align: 'left',
	letterSpacing: 0,
};

export const fontDescription: Partial<IBitmapTextStyle> = {
	fontName: 'fontfnt',
	fontSize: 12,
	align: 'center',
	letterSpacing: 0,
};

export const fontName: Partial<IBitmapTextStyle> = {
	fontName: 'fontfnt',
	fontSize: 16,
	align: 'center',
	letterSpacing: -1,
};

export const filterTextOutline = new OutlineFilter(4, 0, 1);
