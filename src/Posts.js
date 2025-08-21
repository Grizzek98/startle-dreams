import { useEffect, useState } from "react";
import { postsQuery } from "./firebase";
import { onSnapshot } from "firebase/firestore";

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
    <section>
      <h2>Posts</h2>
      {posts.length === 0 && <p>no posts yet</p>}
      {posts.map((p) => (
        <article
          key={p.id}
          style={{
            border: "1px solid #eee",
            padding: 12,
            marginBottom: 12,
            borderRadius: 6,
          }}
        >
          <h3>{p.title}</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{p.body}</p>
        </article>
      ))}
    </section>
  );
}
