import { useState } from "react";
import { createPost } from "./firebase";

export default function Editor({ user, showToast }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");

  async function submit(e) {
    e.preventDefault();
    setStatus("posting…");
    if (!title.trim() || !body.trim()) {
      showToast("Title and body cannot be empty.");
      setStatus("");
      return;
    }
    try {
      await createPost(title, body, user.uid);
      setTitle("");
      setBody("");
      setStatus("posted!");
      setTimeout(() => setStatus(""), 1500);
    } catch (err) {
      showToast("Error: " + err.message);
    }
  }

  return (
    <form className="Editor-form" onSubmit={submit}>
      <h3 className="Editor-title">New post</h3>
      <input
        className="Editor-input"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="Editor-textarea"
        placeholder="I dreamt..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="Editor-actions">
        <button className="Editor-publish-btn" type="submit">
          Publish
        </button>
        <span className="Editor-status">{status}</span>
      </div>
    </form>
  );
}
