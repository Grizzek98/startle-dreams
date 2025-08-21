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

  function showToast(msg) {
    setToast(msg);
  }

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

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
            <span>not logged in</span>
          )}
        </div>
      </header>
      {user ? <Editor user={user} showToast={showToast} /> : <Login />}
      <hr className="App-divider" />
      <PostList />
    </div>
  );
}

export default App;
