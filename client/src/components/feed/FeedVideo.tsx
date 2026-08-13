import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export function FeedVideo({
  src,
  className,
}: {
  src: string;
  className: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      void video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  };

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        src={src}
        controls={true}
        controlsList="nodownload"
        muted={false}
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        className={`${className} bg-black`}
      />

      {/* Center Play / Pause Button */}
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={isPlaying ? "Pause video" : "Play video"}
        className={`
          absolute left-1/2 top-1/2
          -translate-x-1/2 -translate-y-1/2
          inline-flex h-10 w-10
          items-center justify-center
          rounded-full
          bg-black/65
          text-white
          shadow-md
          transition-all duration-300 ease-out
          hover:bg-black/80
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-white/90
          ${
            isPlaying
              ? "pointer-events-none scale-90 opacity-0"
              : "pointer-events-auto scale-100 opacity-100"
          }
        `}
      >
        {isPlaying ? (
          <Pause size={19} fill="currentColor" />
        ) : (
          <Play size={19} fill="currentColor" />
        )}
      </button>
    </div>
  );
}
