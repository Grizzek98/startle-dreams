import { useState } from "react";
import { signIn } from "./firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  async function handle(e) {
    e.preventDefault();
    setErr(null);
    try {
      await signIn(email, pw);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <form className="Login-form" onSubmit={handle}>
      <h3 className="Login-title">Admin login</h3>
      <div className="Login-field">
        <input
          className="Login-input"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="Login-field">
        <input
          className="Login-input"
          placeholder="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          type="password"
        />
      </div>
      <button className="Login-btn" type="submit">
        login
      </button>
      {err && <p className="Login-error">{err}</p>}
    </form>
  );
}
