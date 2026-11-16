import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { postsQuery } from "./firebase";

// Live list of posts, shared by the journal and the night sky.
// posts is null while the first snapshot is loading.
export default function usePosts() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState("");

  useEffect(
    () =>
      onSnapshot(
        postsQuery(),
        (snap) => {
          setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setError("");
        },
        (err) => setError(err.message)
      ),
    []
  );

  return { posts, error };
}
