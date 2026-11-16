import React, { useEffect, useState } from "react";

function Toast({ message, duration = 3000, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const hideTimer = setTimeout(() => setVisible(false), duration - 400); // leave time for animation
    const closeTimer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(closeTimer);
    };
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`Toast-popup${visible ? " Toast-popup--visible" : ""}`}>
      {message}
    </div>
  );
}

export default Toast;
