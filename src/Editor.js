import { useState } from "react";
import { createPost } from "./firebase";

export default function Editor({ user }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");

  async function submit(e) {
    e.preventDefault();
    setStatus("posting…");
    try {
      await createPost(title, body, user.uid);
      setTitle("");
      setBody("");
      setStatus("posted!");
      setTimeout(() => setStatus(""), 1500);
    } catch (err) {
      setStatus("error: " + err.message);
    }
  }

  return (
    <form onSubmit={submit} style={{ margin: "1rem 0" }}>
      <h3>New post</h3>
      <input
        placeholder="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%" }}
      />
      <textarea
        placeholder="write content..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        style={{ width: "100%", minHeight: 120 }}
      />
      <div>
        <button type="submit">publish</button>
        <span style={{ marginLeft: 12 }}>{status}</span>
      </div>
    </form>
  );
}
