import './Login.css';

export default function Login({ onLogin }) {
	const handleSubmit = (event) => {
		event.preventDefault();
		onLogin();
	};

	return <main className="login-page">
		<section className="brand-panel">
			<div className="brand-lockup"><strong>ARC RIDE</strong><span>DAVAO RENT A CAR</span></div>
			<div><h1>Keep every<br /><em>rental</em> moving.</h1></div>
			<small className="brand-foot">ARC CAR RENTAL · ADMIN PORTAL</small>
		</section>
		<section className="login-panel">
			<div className="login-card">
				<p className="eyebrow">WELCOME BACK</p>
				<h2>Sign in to your console</h2>
				<p className="muted">Use your authorized staff account to continue.</p>
				<form onSubmit={handleSubmit} noValidate>
					<label htmlFor="email">Work email</label>
					<input id="email" type="email" placeholder="owner@arcrental.com" required />
					<label htmlFor="password">Password</label>
					<input id="password" type="password" placeholder="Enter your password" minLength="8" required />
					<button className="primary" type="submit">Sign in to ARC <span>→</span></button>
				</form>
				<p className="secure-note">⌁ Secure workspace · Laravel Sanctum session</p>
			</div>
		</section>
	</main>;
}
