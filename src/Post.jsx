import { useState } from "react";
import { updatePost, deletePost } from "./firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function formatDate(ts) {
  const d = ts?.toDate?.();
  if (!d) return "";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Post({ post, user }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postDate, setPostDate] = useState(new Date());
  const [error, setError] = useState("");

  // Load the latest saved values each time editing starts, so cancel discards changes.
  function startEditing() {
    setTitle(post.title);
    setBody(post.body);
    setPostDate(post.postDate?.toDate ? post.postDate.toDate() : new Date());
    setError("");
    setEditing(true);
  }

  async function handleEdit(e) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !body.trim()) {
      setError("Title and body cannot be empty.");
      return;
    }
    try {
      await updatePost(post.id, title.trim(), body.trim(), postDate);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deletePost(post.id);
    } catch (err) {
      setError(err.message);
    }
  }

  if (editing) {
    return (
      <article className="card post">
        <form onSubmit={handleEdit}>
          <input
            className="title-input"
            aria-label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            aria-label="Dream"
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="form-row">
            <label className="date-field">
              <span>Dreamt on</span>
              <DatePicker
                selected={postDate}
                onChange={(date) => date && setPostDate(date)}
                dateFormat="yyyy-MM-dd"
              />
            </label>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!title.trim() || !body.trim()}
            >
              Save
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </form>
      </article>
    );
  }

  return (
    <article className="card post">
      <time className="post-date">{formatDate(post.postDate)}</time>
      <h3 className="post-title">{post.title}</h3>
      <p className="post-body">{post.body}</p>
      {user && (
        <div className="post-actions">
          <button className="btn-ghost" onClick={startEditing}>
            Edit
          </button>
          <button className="btn-ghost danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </article>
  );
}
