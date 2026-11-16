import { useState } from "react";
import { signIn } from "./firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function handle(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await signIn(email, pw);
    } catch {
      setErr("That email and password didn't work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="login" onSubmit={handle}>
      <h2>Admin login</h2>
      <input
        type="email"
        autoComplete="username"
        placeholder="Email"
        aria-label="Email"
        value={email}
        autoFocus
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        aria-label="Password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />
      <button className="btn-primary" type="submit" disabled={busy}>
        {busy ? "Logging in…" : "Log in"}
      </button>
      {err && <p className="error">{err}</p>}
    </form>
  );
}
