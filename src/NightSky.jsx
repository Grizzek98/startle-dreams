import { useEffect, useRef } from "react";
import { createSky } from "./sky/engine";
import "./sky/sky.css";

// React wrapper around the imperative sky renderer (see sky/engine.js).
export default function NightSky({ posts, onSelect }) {
  const rootRef = useRef(null);
  const skyRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const sky = createSky(rootRef.current, {
      onSelect: (id) => onSelectRef.current?.(id),
    });
    skyRef.current = sky;
    return () => sky.destroy();
  }, []);

  useEffect(() => {
    if (!posts || !skyRef.current) return;
    skyRef.current.setDreams(
      posts.map((p) => ({
        id: p.id,
        date: p.postDate?.toDate?.(),
        len: (p.body || "").length,
      }))
    );
  }, [posts]);

  return <div ref={rootRef} className="night-sky" />;
}
