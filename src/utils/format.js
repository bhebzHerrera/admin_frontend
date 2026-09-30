const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
const currencyExact = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
const compactCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', notation: 'compact', maximumFractionDigits: 1 });
const number = new Intl.NumberFormat('en-PH');
const dateFmt = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export const formatCurrency = (value, exact = false) => (exact ? currencyExact : currency).format(Number(value) || 0);
export const formatCompactCurrency = (value) => compactCurrency.format(Number(value) || 0);
export const formatNumber = (value) => number.format(Number(value) || 0);
export const formatDate = (iso) => (iso ? dateFmt.format(new Date(iso)) : '—');
export const formatDateTime = (iso) => (iso ? dateTimeFmt.format(new Date(iso)) : '—');

export function formatDateRange(start, end) {
	return `${formatDate(start)} – ${formatDate(end)}`;
}

export function timeAgo(iso) {
	if (!iso) return '—';
	const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
	const units = [
		['day', 86_400],
		['hour', 3_600],
		['minute', 60],
	];
	for (const [unit, size] of units) {
		if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
	}
	return 'just now';
}

/** "exited_zone" -> "Exited zone" */
export const humanize = (value) => (value ? String(value).replaceAll('_', ' ').replace(/^\w/, (c) => c.toUpperCase()) : '—');
