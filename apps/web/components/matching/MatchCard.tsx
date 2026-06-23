"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { X, Heart, Play, Pause, SkipBack, SkipForward, Disc3 } from "lucide-react";
import styles from "./Deck.module.css";

export interface Track {
  id: string;
  spotifyId?: string;
  title: string;
  artist: string;
  coverUrl: string;
  previewUrl?: string;
  dominantColor?: string | null;
  startTime?: number;
  endTime?: number;
}

export interface Candidate {
  id: string;
  name: string;
  age?: number;
  matchScore: number;
  tracks: Track[];
}

interface VibeCardProps {
  candidate: Candidate;
  isTop: boolean;
  onSwipe: (direction: "left" | "right") => void;
  spotifyIsReady?: boolean;
  onPlaySpotifyTrack?: (trackId: string, offsetMs?: number) => Promise<boolean>;
  onPauseSpotify?: () => void;
}

export default function MatchCard({
  candidate,
  isTop,
  onSwipe,
  spotifyIsReady = false,
  onPlaySpotifyTrack,
  onPauseSpotify,
}: VibeCardProps) {
  const dragX = useMotionValue(0);
  const animationController = useAnimation();

  // Motion interpolations for swipe visual feedback
  const rotationVal = useTransform(dragX, [-220, 220], [-12, 12]);
  const cardOpacity = useTransform(dragX, [-220, -110, 0, 110, 220], [0, 1, 1, 1, 0]);
  const likeBadgeOpacity = useTransform(dragX, [25, 110], [0, 1]);
  const skipBadgeOpacity = useTransform(dragX, [-25, -110], [0, 1]);

  // Playback states
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isCurrentlyPlaying, setIsCurrentlyPlaying] = useState(true);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  
  const soundRef = useRef<HTMLAudioElement | null>(null);
  const schedulerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedTrack = candidate.tracks[currentTrackIndex];
  const activePreview = selectedTrack?.previewUrl;
  const activeSpotifyId = selectedTrack?.spotifyId;

  const currentThemeColor = selectedTrack?.dominantColor || "#16161a";

  const customCardStyles = {
    x: dragX,
    rotate: rotationVal,
    opacity: isTop ? 1 : 0,
    boxShadow: `0 35px 70px -15px rgba(0, 0, 0, 0.9), 0 0 45px 6px ${currentThemeColor}bf`,
    borderColor: currentThemeColor,
    transition: "box-shadow 0.5s ease-out, border-color 0.5s ease-out",
    position: "relative" as const,
    overflow: "hidden" as const,
  };

  // Playback coordination: SDK -> Preview URL -> Simulated Progress
  useEffect(() => {
    if (!isTop) {
      soundRef.current?.pause();
      if (schedulerRef.current) clearInterval(schedulerRef.current);
      onPauseSpotify?.();
      setIsCurrentlyPlaying(false);
      setPlaybackProgress(0);
      setCurrentTrackIndex(0);
      return;
    }

    if (!isCurrentlyPlaying) {
      soundRef.current?.pause();
      if (schedulerRef.current) clearInterval(schedulerRef.current);
      onPauseSpotify?.();
      return;
    }

    // Option A: Spotify SDK Playback
    if (spotifyIsReady && activeSpotifyId && onPlaySpotifyTrack) {
      const positionMs = (selectedTrack.startTime || 0) * 1000;
      console.log("[MatchCard] Triggering Spotify SDK for track:", activeSpotifyId, "from", positionMs, "ms");
      onPlaySpotifyTrack(activeSpotifyId, positionMs);

      if (schedulerRef.current) clearInterval(schedulerRef.current);
      schedulerRef.current = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            if (currentTrackIndex < candidate.tracks.length - 1) {
              setCurrentTrackIndex((i) => i + 1);
              return 0;
            } else {
              setIsCurrentlyPlaying(false);
              return 100;
            }
          }
          return prev + (100 / 300); // 30 seconds total playback
        });
      }, 100);

      return () => {
        if (schedulerRef.current) clearInterval(schedulerRef.current);
      };
    }

    // Option B: HTML5 Audio preview
    if (activePreview && soundRef.current) {
      soundRef.current.play().catch((err) => {
        console.warn("Audio autoplay prevented by browser permissions:", err);
        setIsCurrentlyPlaying(false);
      });
      const audioObj = soundRef.current;
      const syncProgress = () => {
        if (audioObj.duration) {
          setPlaybackProgress((audioObj.currentTime / audioObj.duration) * 100);
        }
      };
      audioObj.addEventListener("timeupdate", syncProgress);
      audioObj.addEventListener("ended", () => {
        if (currentTrackIndex < candidate.tracks.length - 1) {
          setCurrentTrackIndex((prev) => prev + 1);
          setPlaybackProgress(0);
        } else {
          setIsCurrentlyPlaying(false);
          setPlaybackProgress(100);
        }
      });
      return () => {
        audioObj.removeEventListener("timeupdate", syncProgress);
        audioObj.pause();
      };
    }

    // Option C: Simulation fallback
    const mockInterval = setInterval(() => {
      setPlaybackProgress((prev) => {
        if (prev >= 100) {
          if (currentTrackIndex < candidate.tracks.length - 1) {
            setCurrentTrackIndex((idx) => idx + 1);
            return 0;
          } else {
            setIsCurrentlyPlaying(false);
            return 100;
          }
        }
        return prev + (100 / 300);
      });
    }, 100);
    return () => clearInterval(mockInterval);
  }, [isTop, isCurrentlyPlaying, currentTrackIndex, candidate.tracks.length, activePreview, activeSpotifyId, spotifyIsReady]);

  useEffect(() => {
    if (isTop) {
      setIsCurrentlyPlaying(true);
    }
  }, [isTop]);

  // Pause playback when tab visibility is lost
  useEffect(() => {
    const handleVisChange = () => {
      if (document.hidden) {
        setIsCurrentlyPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisChange);
    };
  }, []);

  const elapsedSeconds = Math.floor((playbackProgress / 100) * 30);

  const onDragEnded = async (event: any, info: PanInfo) => {
    const swipeBoundary = 110;
    if (info.offset.x > swipeBoundary) {
      await animationController.start({ x: 550, opacity: 0, transition: { duration: 0.25 } });
      onSwipe("right");
    } else if (info.offset.x < -swipeBoundary) {
      await animationController.start({ x: -550, opacity: 0, transition: { duration: 0.25 } });
      onSwipe("left");
    } else {
      animationController.start({ x: 0, transition: { type: "spring", stiffness: 280, damping: 22 } });
    }
  };

  const handleActionClick = async (dir: "left" | "right") => {
    const destinationX = dir === "right" ? 550 : -550;
    await animationController.start({ x: destinationX, opacity: 0, transition: { duration: 0.25 } });
    onSwipe(dir);
  };

  const togglePlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCurrentlyPlaying(!isCurrentlyPlaying);
  };

  const skipToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
      setPlaybackProgress(0);
      setIsCurrentlyPlaying(true);
    }
  };

  const skipToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentTrackIndex < candidate.tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
      setPlaybackProgress(0);
      setIsCurrentlyPlaying(true);
    }
  };

  const selectDirectTrack = (idx: number) => {
    setCurrentTrackIndex(idx);
    setPlaybackProgress(0);
    setIsCurrentlyPlaying(true);
  };

  return (
    <motion.div
      className={styles.minimalCard}
      style={customCardStyles}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={onDragEnded}
      animate={animationController}
      whileTap={isTop ? { scale: 0.985 } : {}}
    >
      {/* Visual background using album cover blur */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${selectedTrack?.coverUrl || "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(40px) saturate(1.75)",
          opacity: 0.5,
          zIndex: 0,
          transition: "background-image 0.55s ease-in-out",
        }}
      />
      
      {/* Dark layer to guarantee readability */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.9) 100%)",
          zIndex: 1,
        }}
      />

      {/* HTML5 audio element for previews */}
      {activePreview && (
        <audio
          ref={soundRef}
          src={activePreview}
          preload="auto"
          onError={() => {
            console.warn("[MatchCard] Failed loading track preview audio:", activePreview);
          }}
        />
      )}

      {/* Profile Card Header */}
      <div className={styles.cardHeader} style={{ zIndex: 2 }}>
        <img
          src={selectedTrack?.coverUrl || "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80"}
          alt="Album art cover"
          className={styles.albumCover}
          draggable={false}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.style.background = "linear-gradient(135deg, #100e17, #1c1a27, #242232)";
            }
          }}
        />
        <div className={styles.userInfoOverlay}>
          <h2 className={styles.userName}>
            {candidate.name} {candidate.age && `, ${candidate.age}`}
          </h2>
        </div>
      </div>

      {/* Player Section */}
      <div className={styles.playingSection} style={{ zIndex: 2, background: "transparent" }} onPointerDown={(e) => e.stopPropagation()}>
        <div className={styles.controlsHeader}>
          <div className={styles.trackInfo}>
            <p className={styles.trackTitle}>{selectedTrack?.title}</p>
            <p className={styles.trackArtist}>{selectedTrack?.artist}</p>
          </div>

          <div className={styles.playbackControls}>
            <button className={styles.ctrlBtn} onClick={skipToPrevious} disabled={currentTrackIndex === 0}>
              <SkipBack size={24} opacity={currentTrackIndex === 0 ? 0.25 : 1} strokeWidth={2.5} />
            </button>
            <button className={styles.playBtn} onClick={togglePlayback}>
              {isCurrentlyPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}
            </button>
            <button className={styles.ctrlBtn} onClick={skipToNext} disabled={currentTrackIndex === candidate.tracks.length - 1}>
              <SkipForward size={24} opacity={currentTrackIndex === candidate.tracks.length - 1 ? 0.25 : 1} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Dynamic Progress Indicator */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${playbackProgress}%`, backgroundColor: currentThemeColor, boxShadow: `0 0 10px ${currentThemeColor}` }}></div>
          </div>
          <div className={styles.progressTime}>0:{elapsedSeconds.toString().padStart(2, "0")}</div>
        </div>

        {/* Tracks List */}
        <div className={styles.trackList}>
          {candidate.tracks.map((track, index) => {
            const isItemActive = index === currentTrackIndex;
            const elementStyle: React.CSSProperties = isItemActive
              ? {
                  color: "#ffffff",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderLeft: `4px solid ${currentThemeColor}`,
                  paddingLeft: "10px",
                  fontWeight: 600,
                }
              : {
                  color: "rgba(255, 255, 255, 0.7)",
                  paddingLeft: "14px",
                };

            return (
              <div
                key={track.id}
                className={`${styles.trackItem} ${isItemActive ? styles.trackItemActive : ""}`}
                style={elementStyle}
                onClick={() => selectDirectTrack(index)}
              >
                <div className={styles.trackItemNumber} style={{ color: isItemActive ? currentThemeColor : "rgba(255, 255, 255, 0.45)" }}>
                  {isItemActive && isCurrentlyPlaying ? <Disc3 size={13} className="animate-spin" style={{ color: currentThemeColor }} /> : index + 1}
                </div>
                <div className={styles.trackItemText}>
                  <div className={styles.trackItemTitle} style={{ color: isItemActive ? "#ffffff" : "rgba(255, 255, 255, 0.85)" }}>
                    {track.title}
                  </div>
                  <div className={styles.trackItemArtist} style={{ color: isItemActive ? "rgba(255, 255, 255, 0.65)" : "rgba(255, 255, 255, 0.45)" }}>
                    {track.artist}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Swiping controls */}
      <div className={styles.actions} style={{ zIndex: 2, background: "transparent" }}>
        <button className={styles.actionBtn} onClick={() => handleActionClick("left")} onPointerDown={(e) => e.stopPropagation()}>
          <X size={26} />
        </button>
        <button className={styles.actionBtn} onClick={() => handleActionClick("right")} onPointerDown={(e) => e.stopPropagation()}>
          <Heart size={26} />
        </button>
      </div>

      {/* Swipe Feedback badges */}
      <motion.div className={styles.stamp} style={{ opacity: likeBadgeOpacity, borderColor: "#ffffff" }}>
        LIKE
      </motion.div>
      <motion.div className={styles.stamp} style={{ opacity: skipBadgeOpacity, borderColor: "#7a7a7a", color: "#7a7a7a", left: "20px", right: "auto", transform: "rotate(-12deg)" }}>
        NOPE
      </motion.div>
    </motion.div>
  );
}
