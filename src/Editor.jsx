import { useState } from "react";
import { createPost } from "./firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Editor({ user, showToast }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [postDate, setPostDate] = useState(new Date());

  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showToast("Title and body cannot be empty.");
      return;
    }
    setStatus("posting…");
    try {
      await createPost(title.trim(), body.trim(), user.uid, postDate);
      setTitle("");
      setBody("");
      setPostDate(new Date());
      setStatus("posted!");
      setTimeout(() => setStatus(""), 1500);
    } catch (err) {
      setStatus("");
      showToast("Error: " + err.message);
    }
  }

  return (
    <form onSubmit={submit}>
      <h3>New post</h3>
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
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
        />
      </div>
      <div>
        <button type="submit">Publish</button>
        <span>{status}</span>
      </div>
    </form>
  );
}
