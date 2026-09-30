import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Catches render errors in its subtree and shows a recoverable fallback
 * instead of a blank screen. Pass `resetKey` (e.g. the route path) to
 * clear the error automatically when the user navigates away.
 */
export default class ErrorBoundary extends Component {
	state = { error: null };

	static getDerivedStateFromError(error) {
		return { error };
	}

	componentDidCatch(error, info) {
		console.error('[ErrorBoundary]', error, info.componentStack);
	}

	componentDidUpdate(prevProps) {
		if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
			this.setState({ error: null });
		}
	}

	reset = () => this.setState({ error: null });

	render() {
		if (!this.state.error) return this.props.children;

		if (this.props.fallback) return this.props.fallback({ error: this.state.error, reset: this.reset });

		return (
			<div role="alert" className="card mx-auto my-10 max-w-md p-8 text-center">
				<AlertTriangle className="mx-auto size-8 text-danger" aria-hidden="true" />
				<h2 className="mt-4 text-lg font-extrabold tracking-tight">Something went wrong</h2>
				<p className="mt-2 text-sm text-muted">This section failed to display. You can try again or reload the page.</p>
				<div className="mt-6 flex justify-center gap-2">
					<button type="button" className="btn btn-secondary" onClick={this.reset}>
						<RotateCcw className="size-4" aria-hidden="true" /> Try again
					</button>
					<button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
						Reload page
					</button>
				</div>
			</div>
		);
	}
}
