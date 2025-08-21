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
    <form onSubmit={handle} style={{ marginBottom: 20 }}>
      <h3>Admin login</h3>
      <div>
        <input
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
        />
      </div>
      <button type="submit">login</button>
      {err && <p style={{ color: "red" }}>{err}</p>}
    </form>
  );
}
