"use client";

import { useCallback, useEffect, useState } from "react";
import { AsciiVideoDither } from "@/components/ascii-video-dither";

export function LoginFish() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 761px)");
    const sync = () => setShow(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const handleStall = useCallback(() => {}, []);

  if (!show) return null;

  return (
    <AsciiVideoDither
      binarySize
      className="portal-login-fish"
      cols={280}
      darkMode
      invert
      keepSourceVideoWarm
      maxRenderFps={30}
      onPlaybackStall={handleStall}
      playbackStallFallbackMs={1800}
      saturation={2}
      src={["/fish3.mp4", "/fish4.mp4", "/fish2.mp4"]}
      threshold={0.08}
    />
  );
}
