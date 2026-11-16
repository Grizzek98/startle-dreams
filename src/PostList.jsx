import { useEffect, useState } from "react";
import { postsQuery } from "./firebase";
import { onSnapshot } from "firebase/firestore";
import Post from "./Post";

export default function PostList({ user }) {
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
        <Post key={p.id} post={p} user={user} />
      ))}
    </section>
  );
}
