"use client";

import React, { useEffect } from "react";
import MatchCard, { Candidate } from "./MatchCard";
import styles from "./Deck.module.css";
import { Disc3, Music, Music2 } from "lucide-react";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";

interface VibeDeckProps {
  candidatesList: Candidate[];
  isSearching?: boolean;
  onSwipePerform: (targetId: string, actionType: "LIKE" | "SKIP") => void;
}

export default function DeckContainer({
  candidatesList,
  isSearching = false,
  onSwipePerform,
}: VibeDeckProps) {
  const playbackService = useSpotifyPlayer();

  // Pause playback when leaving or unmounting the component
  useEffect(() => {
    return () => {
      playbackService.pause();
    };
  }, [playbackService.pause]);

  const handleCardSwipe = (candidateId: string, swipeDirection: "left" | "right") => {
    const action = swipeDirection === "right" ? "LIKE" : "SKIP";
    onSwipePerform(candidateId, action);
  };

  if (isSearching) {
    return (
      <div className={styles.deckWrapper}>
        <div className={styles.loaderContainer}>
          <div className={styles.loaderGraphic}>
            <Disc3 className="animate-spin" size={72} strokeWidth={1.5} color="#ffffff" />
            <div className={styles.loaderIconLeft}>
              <Music size={24} strokeWidth={2} color="#ffffff" />
            </div>
            <div className={styles.loaderIconRight}>
              <Music2 size={20} strokeWidth={2} color="#ffffff" />
            </div>
          </div>
          <span className={styles.loaderLabel}>Tuning your vibe...</span>
        </div>
      </div>
    );
  }

  if (candidatesList.length === 0) {
    return (
      <div className={styles.deckWrapper}>
        <div className={styles.emptyContainer}>
          <h3 className={styles.emptyTitle}>No new profiles found</h3>
          <p className={styles.emptySubtitle}>Try changing your match filters or check back later!</p>
        </div>
      </div>
    );
  }

  // Display top 3 profiles to optimize rendering performance
  const displayableProfiles = candidatesList.slice(0, 3);

  return (
    <div className={styles.deckWrapper}>
      {playbackService.error && (
        <div className={styles.errorIndicator}>
          <span>⚠️ {playbackService.error}</span>
        </div>
      )}
      {[...displayableProfiles].reverse().map((profile, idx) => {
        const isCurrentActive = idx === displayableProfiles.length - 1;
        return (
          <div key={profile.id} className={styles.layeredCard} style={{ zIndex: idx }}>
            <MatchCard
              candidate={profile}
              isTop={isCurrentActive}
              onSwipe={(dir) => handleCardSwipe(profile.id, dir)}
              spotifyIsReady={playbackService.isReady}
              onPlaySpotifyTrack={playbackService.playTrack}
              onPauseSpotify={playbackService.pause}
            />
          </div>
        );
      })}
    </div>
  );
}
