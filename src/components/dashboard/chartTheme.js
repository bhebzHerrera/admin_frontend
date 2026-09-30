import { useTheme } from '../../context/ThemeContext.jsx';

/*
 * Categorical palette, validated for CVD separation against this app's chart
 * surfaces (#ffffff light, #17343c dark). Slots are assigned in fixed order and
 * each entity keeps its colour regardless of rank or filtering.
 */
const PALETTES = {
	light: {
		series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300'],
		severity: { minor: '#eda100', moderate: '#eb6834', severe: '#d03b3b', critical: '#7c1d2b' },
		grid: '#e6eeec',
		axis: '#6f8489',
		surface: '#ffffff',
		ink: '#172f3a',
	},
	dark: {
		series: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300'],
		severity: { minor: '#c98500', moderate: '#d95926', severe: '#e66767', critical: '#ff9b9b' },
		grid: '#25454d',
		axis: '#a8bfc1',
		surface: '#17343c',
		ink: '#edf7f5',
	},
};

export const VEHICLE_TYPES = ['sedan', 'suv', 'mpv', 'van', 'pickup', 'hatchback'];
export const VEHICLE_STATUSES = ['available', 'rented', 'reserved', 'maintenance'];

export function useChartTheme() {
	const { theme } = useTheme();
	const palette = PALETTES[theme];

	return {
		...palette,
		/** Colour follows the entity (fixed index in its category list), never its rank. */
		colorFor: (list, key) => palette.series[Math.max(0, list.indexOf(key)) % palette.series.length],
		axisProps: {
			stroke: palette.grid,
			tick: { fill: palette.axis, fontSize: 11, fontFamily: 'DM Mono, monospace' },
			tickLine: false,
			axisLine: { stroke: palette.grid },
		},
		tooltipProps: {
			cursor: { fill: palette.grid, fillOpacity: 0.5 },
			contentStyle: {
				background: palette.surface,
				border: `1px solid ${palette.grid}`,
				borderRadius: 8,
				fontSize: 12,
				color: palette.ink,
				boxShadow: '0 8px 24px rgba(0,0,0,.12)',
			},
			labelStyle: { fontWeight: 800, marginBottom: 4, color: palette.ink },
			itemStyle: { color: palette.ink, padding: 0 },
		},
	};
}
