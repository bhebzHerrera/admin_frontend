import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Client-side validation mirrors the Laravel LoginRequest rules. */
function validate({ email, password }) {
	const errors = {};
	if (!email) errors.email = 'Please enter your work email.';
	else if (email.length > 255 || !EMAIL_PATTERN.test(email)) errors.email = 'Please enter a valid email address.';
	if (!password) errors.password = 'Please enter your password.';
	else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
	return errors;
}

export default function Login() {
	const { login, isAuthenticated, notice } = useAuth();
	const { theme, toggleTheme } = useTheme();
	const navigate = useNavigate();
	const location = useLocation();

	const [values, setValues] = useState({ email: '', password: '' });
	const [touched, setTouched] = useState({});
	const [serverErrors, setServerErrors] = useState({});
	const [formError, setFormError] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const redirectTo = location.state?.from?.pathname ?? '/';
	if (isAuthenticated) return <Navigate to={redirectTo} replace />;

	const clean = { email: values.email.trim().toLowerCase(), password: values.password };
	const clientErrors = validate(clean);
	const errorFor = (field) => serverErrors[field] ?? (touched[field] ? clientErrors[field] : undefined);

	const handleChange = (event) => {
		const { name, value } = event.target;
		setValues((prev) => ({ ...prev, [name]: value }));
		setServerErrors((prev) => ({ ...prev, [name]: undefined }));
		setFormError('');
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setTouched({ email: true, password: true });
		if (Object.keys(clientErrors).length) return;

		setSubmitting(true);
		setFormError('');
		try {
			await login(clean.email, clean.password);
			navigate(redirectTo, { replace: true });
		} catch (error) {
			if (error.status === 422 && Object.keys(error.errors).length) {
				setServerErrors(Object.fromEntries(Object.entries(error.errors).map(([field, messages]) => [field, messages[0]])));
			} else {
				setFormError(error.message);
			}
			setValues((prev) => ({ ...prev, password: '' }));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<main className="grid min-h-screen md:grid-cols-2">
			<section className="flex min-h-[280px] flex-col justify-between bg-night px-7 py-8 text-white md:px-[9vw] md:py-10">
				<div className="leading-none">
					<strong className="block text-2xl font-extrabold tracking-[0.08em] italic">ARC RIDE</strong>
					<span className="mt-1.5 block font-mono text-[9px] font-medium tracking-[0.28em] text-[#15b9ed]">DAVAO RENT A CAR</span>
				</div>
				<h1 className="my-4 text-[clamp(40px,5vw,70px)] leading-none font-extrabold tracking-[-0.06em]">
					Keep every
					<br />
					<em className="text-cyan not-italic">rental</em> moving.
				</h1>
				<p className="font-mono text-[10px] tracking-[0.2em] text-[#abc2c5]">ARC CAR RENTAL · ADMIN PORTAL</p>
			</section>

			<section className="relative grid place-items-center px-6 py-10">
				<button type="button" onClick={toggleTheme} className="btn btn-secondary absolute top-5 right-5 rounded-full px-3" aria-label="Toggle theme">
					{theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
				</button>

				<div className="w-full max-w-[390px]">
					<p className="eyebrow">Welcome back</p>
					<h2 className="mt-3 mb-2 text-[30px] font-extrabold tracking-[-0.05em]">Sign in to your console</h2>
					<p className="text-[13px] text-muted">Use your authorized staff account to continue.</p>

					{(formError || notice) && (
						<div role="alert" className={`mt-6 flex items-start gap-2 rounded-md p-3 text-xs font-semibold ${formError ? 'bg-danger-soft text-danger' : 'bg-info-soft text-info'}`}>
							<AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
							{formError || notice}
						</div>
					)}

					<form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
						<Field label="Work email" id="email" error={errorFor('email')}>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="username"
								inputMode="email"
								maxLength={255}
								placeholder="owner@arcrental.com"
								value={values.email}
								onChange={handleChange}
								onBlur={() => setTouched((t) => ({ ...t, email: true }))}
								aria-invalid={Boolean(errorFor('email'))}
								aria-describedby={errorFor('email') ? 'email-error' : undefined}
								className={`input py-3 ${errorFor('email') ? 'border-danger focus:border-danger focus:ring-danger-soft' : ''}`}
							/>
						</Field>

						<Field label="Password" id="password" error={errorFor('password')}>
							<div className="relative">
								<input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									autoComplete="current-password"
									maxLength={255}
									placeholder="Enter your password"
									value={values.password}
									onChange={handleChange}
									onBlur={() => setTouched((t) => ({ ...t, password: true }))}
									aria-invalid={Boolean(errorFor('password'))}
									aria-describedby={errorFor('password') ? 'password-error' : undefined}
									className={`input py-3 pr-11 ${errorFor('password') ? 'border-danger focus:border-danger focus:ring-danger-soft' : ''}`}
								/>
								<button
									type="button"
									onClick={() => setShowPassword((v) => !v)}
									className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-ink"
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
								</button>
							</div>
						</Field>

						<button type="submit" disabled={submitting} className="btn btn-primary w-full justify-between py-3.5 text-[13px]">
							{submitting ? 'Signing in…' : 'Sign in to ARC'}
							{submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
						</button>
					</form>

					<p className="mt-8 flex items-center gap-2 border-t border-divider pt-4 text-[11px] text-muted">
						<Lock className="size-3.5" aria-hidden="true" /> Secure workspace · Laravel Sanctum token session
					</p>
				</div>
			</section>
		</main>
	);
}

function Field({ label, id, error, children }) {
	return (
		<div>
			<label htmlFor={id} className="mb-2 block text-xs font-extrabold">
				{label}
			</label>
			{children}
			{error && (
				<p id={`${id}-error`} className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-danger">
					<AlertCircle className="size-3.5" aria-hidden="true" /> {error}
				</p>
			)}
		</div>
	);
}
