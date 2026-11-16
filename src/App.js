import { onAuthStateChanged } from "firebase/auth";
import "./App.css";
import { useEffect, useState } from "react";
import { auth, logOut } from "./firebase";
import Login from "./Login";
import Editor from "./Editor";
import PostList from "./PostList";
import Toast from "./Toast";

function App() {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  function showToast(msg) {
    setToast(msg);
  }

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // Close login modal when user logs in or logs out
  useEffect(() => {
    setShowLogin(false);
  }, [user]);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    return () => document.body.classList.remove("dark-mode");
  }, [darkMode]);

  return (
    <div>
      <Toast message={toast} onClose={() => setToast("")} />
      <header>
        <h1>Startle Dreams</h1>
        <div>
          <button
            onClick={() => setDarkMode((d) => !d)}
            aria-label="Toggle dark mode"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          {user ? (
            <>
              <span>hi, {user.email}</span>
              <button onClick={() => logOut()}>logout</button>
            </>
          ) : (
            <button onClick={() => setShowLogin(true)}>Login</button>
          )}
        </div>
      </header>
      {/* Modal for login */}
      {showLogin && !user && (
        <div className="Modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="Modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="Modal-close" onClick={() => setShowLogin(false)}>
              &times;
            </button>
            <Login />
          </div>
        </div>
      )}
      {user ? <Editor user={user} showToast={showToast} /> : null}
      <hr />
      <PostList user={user} />
    </div>
  );
}

export default App;
