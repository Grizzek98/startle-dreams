import { useState } from "react";
import { db } from "./firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Post({ post, user }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [postDate, setPostDate] = useState(
    post.postDate?.toDate ? post.postDate.toDate() : new Date()
  );
  const [error, setError] = useState("");

  async function handleEdit(e) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !body.trim()) {
      setError("Title and body cannot be empty.");
      return;
    }
    try {
      const postRef = doc(db, "posts", post.id);
      await updateDoc(postRef, {
        title,
        body,
        postDate: Timestamp.fromDate(postDate),
      });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this post?")) return;
    try {
      const postRef = doc(db, "posts", post.id);
      await deleteDoc(postRef);
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
          {user && <button onClick={() => setEditing(true)}>Edit</button>}
          {user && <button onClick={handleDelete}>Delete</button>}
          {error && <div>{error}</div>}
        </>
      )}
    </article>
  );
}
