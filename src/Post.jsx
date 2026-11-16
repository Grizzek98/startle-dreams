import { useState } from "react";
import { updatePost, deletePost } from "./firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

  return (
    <article>
      {editing ? (
        <form onSubmit={handleEdit}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ marginRight: 8 }}>Date:</label>
            <DatePicker
              selected={postDate}
              onChange={(date) => setPostDate(date)}
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <button type="submit" disabled={!title.trim() || !body.trim()}>
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)}>
            Cancel
          </button>
          {error && <div>{error}</div>}
        </form>
      ) : (
        <>
          <h3>{post.title}</h3>
          <p>{post.body}</p>
          {user && <button onClick={startEditing}>Edit</button>}
          {user && <button onClick={handleDelete}>Delete</button>}
          {error && <div>{error}</div>}
        </>
      )}
    </article>
  );
}
