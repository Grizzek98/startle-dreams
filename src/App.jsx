import { onAuthStateChanged } from "firebase/auth";
import "./App.css";
import { useCallback, useEffect, useState } from "react";
import { auth, logOut } from "./firebase";
import Login from "./Login";
import Editor from "./Editor";
import PostList from "./PostList";
import Toast from "./Toast";

function initialTheme() {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // storage unavailable; fall through to system preference
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function App() {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [theme, setTheme] = useState(initialTheme);

  const showToast = useCallback((msg) => setToast(msg), []);
  const clearToast = useCallback(() => setToast(""), []);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  // Close login modal when user logs in or logs out
  useEffect(() => setShowLogin(false), [user]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    if (!showLogin) return;
    const onKey = (e) => e.key === "Escape" && setShowLogin(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLogin]);

  const dark = theme === "dark";

  return (
    <div className="app">
      <Toast message={toast} onClose={clearToast} />
      <header className="site-header">
        <div>
          <h1 className="site-title">Startle Dreams</h1>
          <p className="site-tagline">a journal of things seen while sleeping</p>
        </div>
        <nav className="site-actions">
          <button
            className="icon-btn"
            onClick={() => setTheme(dark ? "light" : "dark")}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? "☀" : "☾"}
          </button>
          {user ? (
            <>
              <span className="user-email">{user.email}</span>
              <button className="btn-ghost" onClick={() => logOut()}>
                Log out
              </button>
            </>
          ) : (
            <button className="btn-ghost" onClick={() => setShowLogin(true)}>
              Log in
            </button>
          )}
        </nav>
      </header>

      {showLogin && !user && (
        <div className="Modal-overlay" onClick={() => setShowLogin(false)}>
          <div
            className="Modal-content"
            role="dialog"
            aria-modal="true"
            aria-label="Log in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="Modal-close icon-btn"
              aria-label="Close"
              onClick={() => setShowLogin(false)}
            >
              &times;
            </button>
            <Login />
          </div>
        </div>
      )}

      <main>
        {user && <Editor user={user} showToast={showToast} />}
        <PostList user={user} />
      </main>
    </div>
  );
}

export default App;
