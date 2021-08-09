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
