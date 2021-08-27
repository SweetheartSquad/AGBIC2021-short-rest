export const firePath = [
	50,0,
	91,35,
	70,66,
	100,80,
	87,90,
	54,79,
	56,100,
	26,96,
	36,80,
	5,89,
	0,69,
	21,64,
	6,36,
].map(i => (i/100-0.5))
	.join(',')
	.split(/(-?\d+\.?\d*,-?\d+\.?\d*),?/)
	.filter(i => i)
	.map(i => i.split(',').map(j => parseFloat(j))) as [number, number][];