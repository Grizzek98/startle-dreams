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
    <form className="card editor" onSubmit={submit}>
      <h2>New dream</h2>
      <input
        className="title-input"
        placeholder="Title"
        aria-label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="I dreamt…"
        aria-label="Dream"
        rows={6}
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
        <span className="status">{status}</span>
        <button
          className="btn-primary"
          type="submit"
          disabled={status === "posting…"}
        >
          Publish
        </button>
      </div>
    </form>
  );
}
