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

  return (
    <div className="App-container">
      <Toast message={toast} onClose={() => setToast("")} />
      <header className="App-header-bar">
        <h1 className="App-title">Startle Dreams</h1>
        <div className="App-user-bar">
          {user ? (
            <>
              <span className="App-user-email">hi, {user.email}</span>
              <button className="App-logout-btn" onClick={() => logOut()}>
                logout
              </button>
            </>
          ) : (
            <button
              className="App-login-btn"
              onClick={() => setShowLogin(true)}
            >
              Login
            </button>
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
      <hr className="App-divider" />
      <PostList user={user} />
    </div>
  );
}

export default App;
