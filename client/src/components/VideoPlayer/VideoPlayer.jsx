import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import "./VideoPlayer.css";

export default function VideoPlayer({ slides, title, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const SLIDE_DURATION = 4000; // 4 seconds per slide

  const totalSlides = slides?.length || 0;

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            // Move to next slide
            setCurrentSlide((curr) => {
              if (curr >= totalSlides - 1) {
                setPlaying(false);
                return curr;
              }
              return curr + 1;
            });
            return 0;
          }
          return prev + (100 / (SLIDE_DURATION / 100));
        });
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, totalSlides]);

  // Reset progress when slide changes manually
  useEffect(() => {
    setProgress(0);
  }, [currentSlide]);

  const handlePlay = () => setPlaying((p) => !p);

  const handlePrev = () => {
    setPlaying(false);
    setCurrentSlide((c) => Math.max(0, c - 1));
  };

  const handleNext = () => {
    setPlaying(false);
    setCurrentSlide((c) => Math.min(totalSlides - 1, c + 1));
  };

  const handleSlideClick = (index) => {
    setPlaying(false);
    setCurrentSlide(index);
  };

  if (!slides || slides.length === 0) return null;

  const slide = slides[currentSlide];

  return (
    <div className="vp-wrapper">
      {/* Main slide display */}
      <div className="vp-screen">
        {/* ET branding bar */}
        <div className="vp-brand-bar">
          <span className="vp-et-badge">ET</span>
          <span className="vp-brand-text">Story Arc</span>
          <span className="vp-slide-counter">
            {currentSlide + 1} / {totalSlides}
          </span>
        </div>

        {/* Slide content */}
        <div className="vp-slide" key={currentSlide}>
          {slide.type === "title" && (
            <div className="vp-slide-title-layout">
              <div className="vp-slide-category">{slide.category || "Breaking News"}</div>
              <h2 className="vp-slide-headline">{slide.text}</h2>
              {slide.subtext && (
                <p className="vp-slide-subtext">{slide.subtext}</p>
              )}
            </div>
          )}

          {slide.type === "fact" && (
            <div className="vp-slide-fact-layout">
              <div className="vp-slide-fact-number">{slide.number}</div>
              <div className="vp-slide-fact-content">
                <p className="vp-slide-fact-text">{slide.text}</p>
                {slide.context && (
                  <p className="vp-slide-fact-context">{slide.context}</p>
                )}
              </div>
            </div>
          )}

          {slide.type === "quote" && (
            <div className="vp-slide-quote-layout">
              <div className="vp-slide-quote-mark">"</div>
              <p className="vp-slide-quote-text">{slide.text}</p>
              {slide.attribution && (
                <p className="vp-slide-attribution">— {slide.attribution}</p>
              )}
            </div>
          )}

          {slide.type === "summary" && (
            <div className="vp-slide-summary-layout">
              <h3 className="vp-slide-summary-title">{slide.title}</h3>
              <ul className="vp-slide-summary-points">
                {slide.points?.map((point, i) => (
                  <li key={i} className="vp-slide-summary-point">{point}</li>
                ))}
              </ul>
            </div>
          )}

          {slide.type === "outro" && (
            <div className="vp-slide-outro-layout">
              <span className="vp-et-badge vp-et-badge-large">ET</span>
              <p className="vp-slide-outro-text">{slide.text}</p>
              <p className="vp-slide-outro-sub">economictimes.com</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="vp-progress-bar">
          <div
            className="vp-progress-fill"
            style={{ width: `${((currentSlide / (totalSlides - 1)) * 100)}%` }}
          />
        </div>

        {/* Current slide progress */}
        <div className="vp-slide-progress">
          <div
            className="vp-slide-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="vp-controls">
        <button className="vp-ctrl-btn" onClick={handlePrev} disabled={currentSlide === 0}>
          <SkipBack size={16} />
        </button>
        <button className="vp-play-btn" onClick={handlePlay}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="vp-ctrl-btn" onClick={handleNext} disabled={currentSlide === totalSlides - 1}>
          <SkipForward size={16} />
        </button>
        <div className="vp-vol-indicator">
          <Volume2 size={14} />
          <span className="vp-vol-text">Auto-narration</span>
        </div>
      </div>

      {/* Slide thumbnails */}
      <div className="vp-thumbnails">
        {slides.map((s, i) => (
          <button
            key={i}
            className={`vp-thumb ${i === currentSlide ? "vp-thumb-active" : ""}`}
            onClick={() => handleSlideClick(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}