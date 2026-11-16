import { useMemo, useState } from "react";
import Post from "./Post";

export default function PostList({ user, posts, error }) {
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!posts || !q) return posts;
    return posts.filter((p) => p.body?.toLowerCase().includes(q));
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
