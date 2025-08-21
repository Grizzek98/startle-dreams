import { onAuthStateChanged } from "firebase/auth";
import "./App.css";
import { useEffect, useState } from "react";
import { auth, logOut } from "./firebase";
import Login from "./Login";
import Editor from "./Editor";
import Posts from "./Posts";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Startle Dreams</h1>
        <div>
          {user ? (
            <>
              <span style={{ marginRight: 12 }}>hi, {user.email}</span>
              <button onClick={() => logOut()}>logout</button>
            </>
          ) : (
            <span>not logged in</span>
          )}
        </div>
      </header>
      {user ? <Editor user={user} /> : <Login />}
      <hr />
      <Posts />
    </div>
  );
}

export default App;
