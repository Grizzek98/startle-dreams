import { onAuthStateChanged } from "firebase/auth";
import "./App.css";
import { useCallback, useEffect, useState } from "react";
import { auth, logOut } from "./firebase";
import Login from "./Login";
import Editor from "./Editor";
import PostList from "./PostList";
import Toast from "./Toast";
import NightSky from "./NightSky";
import DreamDialog from "./DreamDialog";
import usePosts from "./usePosts";

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

// The URL hash picks the view: #sky for the night sky, anything else is the journal.
const viewFromHash = () => (window.location.hash === "#sky" ? "sky" : "journal");

function App() {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [theme, setTheme] = useState(initialTheme);
  const [view, setView] = useState(viewFromHash);
  const [selectedId, setSelectedId] = useState(null);
  const { posts, error } = usePosts();

  const showToast = useCallback((msg) => setToast(msg), []);
  const clearToast = useCallback(() => setToast(""), []);
  const closeDream = useCallback(() => setSelectedId(null), []);

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

  useEffect(() => {
    const onHash = () => {
      setView(viewFromHash());
      setSelectedId(null);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // "See it in the journal" links to #post-<id>; scroll there once the list is rendered.
  useEffect(() => {
    if (view !== "journal" || !posts) return;
    const m = window.location.hash.match(/^#post-(.+)$/);
    const el = m && document.getElementById(`post-${m[1]}`);
    if (!el) return;
    document.querySelectorAll(".post.is-target").forEach((n) => n.classList.remove("is-target"));
    el.classList.add("is-target");
    el.scrollIntoView({ block: "center" });
  }, [view, posts]);

  const dark = theme === "dark";
  const selectedPost = selectedId && posts?.find((p) => p.id === selectedId);

  return (
    <div className={`page${view === "sky" ? " page-sky" : ""}`}>
      <div className="app">
        <Toast message={toast} onClose={clearToast} />
        <header className="site-header">
          <div>
            <h1 className="site-title">Startle Dreams</h1>
            <p className="site-tagline">a journal of things seen while sleeping</p>
            <nav className="view-tabs" aria-label="Views">
              <a href="#journal" aria-current={view === "journal" ? "page" : undefined}>
                Journal
              </a>
              <a href="#sky" aria-current={view === "sky" ? "page" : undefined}>
                Sky
              </a>
            </nav>
          </div>
          <div className="site-actions">
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
          </div>
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

        {view === "journal" && (
          <main>
            {user && <Editor user={user} showToast={showToast} />}
            <PostList user={user} posts={posts} error={error} />
          </main>
        )}
      </div>

      {view === "sky" && <NightSky posts={posts} onSelect={setSelectedId} />}
      {selectedPost && <DreamDialog post={selectedPost} onClose={closeDream} />}
    </div>
  );
}

export default App;
