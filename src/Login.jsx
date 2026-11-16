import { useState } from "react";
import { signIn } from "./firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  async function handle(e) {
    e.preventDefault();
    setErr("");
    try {
      await signIn(email, pw);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <form onSubmit={handle}>
      <h3>Admin login</h3>
      <div>
        <input
          type="email"
          autoComplete="username"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <input
          placeholder="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          type="password"
          autoComplete="current-password"
        />
      </div>
      <button type="submit">login</button>
      {err && <p>{err}</p>}
    </form>
  );
}
