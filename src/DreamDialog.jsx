import { useEffect } from "react";
import { formatDate } from "./Post";

// Opens when a star is clicked in the night sky.
export default function DreamDialog({ post, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const date = formatDate(post.postDate);

  return (
    <div className="Modal-overlay" onClick={onClose}>
      <div
        className="Modal-content dream-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={date || "Dream"}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="Modal-close icon-btn"
          aria-label="Close"
          onClick={onClose}
          autoFocus
        >
          &times;
        </button>
        <time className="post-date">{date}</time>
        <p className="post-body">{post.body}</p>
        <a className="dialog-link" href={`#post-${post.id}`}>
          See it in the journal →
        </a>
      </div>
    </div>
  );
}
