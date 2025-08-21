import { useState } from "react";
import { db } from "./firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Post({ post }) {
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
    <article className="Post-article">
      {editing ? (
        <form className="Post-edit-form" onSubmit={handleEdit}>
          <input
            className="Post-edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="Post-edit-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div style={{ marginBottom: 12 }}>
            <label style={{ marginRight: 8 }}>Date:</label>
            <DatePicker
              selected={postDate}
              onChange={(date) => setPostDate(date)}
              dateFormat="yyyy-MM-dd"
              className="Post-edit-title"
            />
          </div>
          <button
            className="Post-save-btn"
            type="submit"
            disabled={!title.trim() || !body.trim()}
          >
            Save
          </button>
          <button
            className="Post-cancel-btn"
            type="button"
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
          {error && <div className="Post-error">{error}</div>}
        </form>
      ) : (
        <>
          <h3 className="Post-title">{post.title}</h3>
          <p className="Post-body">{post.body}</p>
          <button className="Post-edit-btn" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button className="Post-delete-btn" onClick={handleDelete}>
            Delete
          </button>
          {error && <div className="Post-error">{error}</div>}
        </>
      )}
    </article>
  );
}
