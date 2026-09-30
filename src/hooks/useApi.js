import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Fetches data with loading / error state, request cancellation and optional polling.
 *
 * @param {(signal: AbortSignal) => Promise<any>} fetcher
 * @param {Array} deps       re-fetch when these change
 * @param {{ interval?: number }} options  poll every `interval` ms (silently, keeping old data)
 */
export function useApi(fetcher, deps = [], { interval } = {}) {
	const [state, setState] = useState({ data: null, loading: true, error: null, updatedAt: null });
	const [reloadKey, setReloadKey] = useState(0);
	const fetcherRef = useRef(fetcher);
	fetcherRef.current = fetcher;

	const reload = useCallback(() => setReloadKey((key) => key + 1), []);

	useEffect(() => {
		const controller = new AbortController();
		let timer;

		const run = async (background) => {
			if (!background) setState((prev) => ({ ...prev, loading: true, error: null }));
			try {
				const data = await fetcherRef.current(controller.signal);
				setState({ data, loading: false, error: null, updatedAt: new Date() });
			} catch (error) {
				if (controller.signal.aborted) return;
				setState((prev) => ({ ...prev, loading: false, error }));
			}
			if (interval && !controller.signal.aborted) timer = setTimeout(() => run(true), interval);
		};

		run(false);

		return () => {
			controller.abort();
			clearTimeout(timer);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [...deps, reloadKey, interval]);

	return { ...state, reload };
}

export function useDebouncedValue(value, delay = 350) {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
}
