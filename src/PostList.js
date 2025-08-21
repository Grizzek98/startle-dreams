import { useEffect, useState } from "react";
import { postsQuery } from "./firebase";
import { onSnapshot } from "firebase/firestore";
import Post from "./Post";

export default function Posts() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const q = postsQuery();
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  return (
    <section className="PostList-section">
      <h2 className="PostList-title">Posts</h2>
      {posts.length === 0 && <p className="PostList-empty">no posts yet</p>}
      {posts.map((p) => (
        <Post key={p.id} post={p} />
      ))}
    </section>
  );
}
