import { humanize } from '../../utils/format.js';

const TONES = {
	success: 'bg-success-soft text-success',
	warning: 'bg-warning-soft text-warning',
	danger: 'bg-danger-soft text-danger',
	info: 'bg-info-soft text-info',
	accent: 'bg-soft text-accent-strong',
	neutral: 'bg-surface-2 text-muted border border-divider',
};

/** Maps every status value used by the API to a tone. */
const STATUS_TONES = {
	// vehicles
	available: 'success',
	rented: 'info',
	reserved: 'accent',
	maintenance: 'warning',
	// reservations
	pending: 'warning',
	confirmed: 'accent',
	active: 'info',
	completed: 'success',
	cancelled: 'neutral',
	// payments
	paid: 'success',
	partial: 'warning',
	unpaid: 'danger',
	refunded: 'neutral',
	// collisions
	new: 'danger',
	acknowledged: 'warning',
	resolved: 'success',
	minor: 'warning',
	moderate: 'warning',
	severe: 'danger',
	critical: 'danger',
	// customers
	suspended: 'danger',
	// payment verifications / rental extensions
	verified: 'success',
	rejected: 'danger',
	approved: 'success',
	// vehicle maintenance
	scheduled: 'accent',
	overdue: 'danger',
	// health / trust tiers
	excellent: 'success',
	good: 'accent',
	fair: 'warning',
	poor: 'danger',
	at_risk: 'danger',
};

export default function StatusBadge({ status, tone, label, className = '' }) {
	const resolved = tone ?? STATUS_TONES[status] ?? 'neutral';
	return (
		<span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 font-mono text-[10px] font-medium whitespace-nowrap uppercase ${TONES[resolved]} ${className}`}>
			<span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
			{label ?? humanize(status)}
		</span>
	);
}
