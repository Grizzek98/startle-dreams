import { useState } from "react";
import { createPost } from "./firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Timestamp } from "firebase/firestore";

export default function Editor({ user, showToast }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [postDate, setPostDate] = useState(new Date());

  async function submit(e) {
    e.preventDefault();
    setStatus("posting…");
    if (!title.trim() || !body.trim()) {
      showToast("Title and body cannot be empty.");
      setStatus("");
      return;
    }
    try {
      await createPost(title, body, user.uid, Timestamp.fromDate(postDate));
      setTitle("");
      setBody("");
      setPostDate(new Date());
      setStatus("posted!");
      setTimeout(() => setStatus(""), 1500);
    } catch (err) {
      showToast("Error: " + err.message);
      if (showToast) showToast("Error: " + err.message);
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
      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Date:</label>
        <DatePicker
          selected={postDate}
          onChange={(date) => setPostDate(date)}
          dateFormat="yyyy-MM-dd"
          className="Editor-input"
        />
      </div>
      <div className="Editor-actions">
        <button className="Editor-publish-btn" type="submit">
          Publish
        </button>
        <span className="Editor-status">{status}</span>
      </div>
    </form>
  );
}
