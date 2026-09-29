import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import Login from './components/auth/Login.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import './theme.css';
import './App.css';

export default function App() {
	const [theme, setTheme] = useState(() => localStorage.getItem('arc-theme') || 'light');
	const [user, setUser] = useState(null);

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
		localStorage.setItem('arc-theme', theme);
	}, [theme]);

	return <>
		{user ? <Dashboard user={user} onLogout={() => setUser(null)} theme={theme} onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} /> : <><button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">
			{theme === 'light' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
		</button><Login onLogin={() => setUser({ name: 'Ariel Herrera', role: 'Owner Account' })} /></>}
	</>;
}
