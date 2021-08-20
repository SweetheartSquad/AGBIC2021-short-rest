import type { ITextStyle } from 'pixi.js';

export const font: Partial<ITextStyle> = {
	fontFamily: 'font',
	fontSize: 24,
	fill: 0x000000,
	stroke: 0xffffff,
	strokeThickness: 2,
	align: 'left',
	lineHeight: 24,
	letterSpacing: 1,
};

export const fontName: Partial<ITextStyle> = {
	fontFamily: 'font',
	fontSize: 32,
	fill: 0x201b20,
	align: 'center',
	lineHeight: 32,
	letterSpacing: 1,
	padding: 5,
};

export const fontTitle: Partial<ITextStyle> = {
	fontFamily: 'font',
	fontSize: 48,
	fill: 'transparent',
	stroke: 0xffffff,
	strokeThickness: 1,
	align: 'left',
	letterSpacing: 1,
	padding: 10,
};
