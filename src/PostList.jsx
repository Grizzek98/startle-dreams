import { useEffect, useMemo, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { postsQuery } from "./firebase";
import Post from "./Post";

export default function PostList({ user }) {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(
      postsQuery(),
      (snap) => setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => setError(err.message)
    );
    return unsub;
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!posts || !q) return posts;
    return posts.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) || p.body?.toLowerCase().includes(q)
    );
  }, [posts, search]);

  return (
    <section className="posts">
      <div className="posts-header">
        <h2>Dreams</h2>
        {posts?.length > 0 && (
          <input
            type="search"
            className="search"
            placeholder="Search dreams…"
            aria-label="Search dreams"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
      </div>
      {error && <p className="error">Could not load posts: {error}</p>}
      {!error && posts === null && <p className="muted">Loading…</p>}
      {posts?.length === 0 && <p className="muted">No dreams yet.</p>}
      {posts?.length > 0 && visible.length === 0 && (
        <p className="muted">No dreams match “{search.trim()}”.</p>
      )}
      {visible?.map((p) => (
        <Post key={p.id} post={p} user={user} />
      ))}
    </section>
  );
}
