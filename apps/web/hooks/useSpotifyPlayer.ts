"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
    _spotifyPlayerInstance: any;
    _spotifyDeviceId: string | null;
  }
}

interface SpotifyPlayerResult {
  isReady: boolean;
  deviceId: string | null;
  error: string | null;
  playTrack: (spotifyId: string, positionMs?: number) => Promise<boolean>;
  pause: () => void;
  resume: () => void;
  seek: (positionMs: number) => Promise<void>;
}

// 全域單例 Promise，確保 SDK 只初始化一次
let sdkInitPromise: Promise<void> | null = null;

function loadSpotifySDK(): Promise<void> {
  if (sdkInitPromise) return sdkInitPromise;
  sdkInitPromise = new Promise<void>((resolve) => {
    if (window.Spotify) {
      resolve();
      return;
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    if (!document.getElementById("spotify-sdk-script")) {
      const script = document.createElement("script");
      script.id = "spotify-sdk-script";
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }
  });
  return sdkInitPromise;
}

export function useSpotifyPlayer(): SpotifyPlayerResult {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let destroyed = false;

    async function init() {
      // 1. 先取得有效 Token
      const res = await fetch("/api/spotify/token");
      if (!res.ok) {
        setError("No Spotify token. Please link Spotify account.");
        return;
      }
      const { accessToken } = await res.json();
      if (!accessToken) {
        setError("Spotify token missing.");
        return;
      }

      // 2. 等待 SDK 腳本載入
      await loadSpotifySDK();
      if (destroyed) return;

      // 3. 若已存在全域播放器實例，直接重用
      if (window._spotifyPlayerInstance) {
        const existing = window._spotifyPlayerInstance;
        const state = await existing.getCurrentState();
        if (state !== null) {
          // 播放器仍然活躍
          playerRef.current = existing;
          setIsReady(true);
          if (window._spotifyDeviceId) {
            setDeviceId(window._spotifyDeviceId);
          }
          return;
        }
        // 播放器失效，重新建立
        existing.disconnect();
        window._spotifyPlayerInstance = null;
        window._spotifyDeviceId = null;
      }

      // 4. 建立新的播放器實例
      const player = new window.Spotify.Player({
        name: "Vibe Music Match",
        getOAuthToken: async (cb: (t: string) => void) => {
          const r = await fetch("/api/spotify/token");
          const { accessToken: t } = await r.json();
          cb(t);
        },
        volume: 0.8,
      });

      window._spotifyPlayerInstance = player;
      playerRef.current = player;

      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("[SpotifySDK] ✅ Ready! Device ID:", device_id);
        window._spotifyDeviceId = device_id;
        if (!destroyed) {
          setDeviceId(device_id);
          setIsReady(true);
          setError(null);
        }
      });

      player.addListener("not_ready", () => {
        if (!destroyed) setIsReady(false);
      });

      player.addListener("initialization_error", ({ message }: any) => {
        console.warn("[SpotifySDK] Init error:", message);
        if (!destroyed) setError(message);
      });

      player.addListener("authentication_error", ({ message }: any) => {
        console.warn("[SpotifySDK] Auth error:", message);
        if (!destroyed) setError("Auth error: " + message);
      });

      player.addListener("account_error", ({ message }: any) => {
        console.warn("[SpotifySDK] Account error:", message);
        if (!destroyed) setError("Spotify Premium required.");
      });

      player.connect();
    }

    init().catch(err => {
      console.warn("[SpotifySDK] Init failed:", err);
      if (!destroyed) setError(err.message);
    });

    return () => {
      destroyed = true;
    };
  }, []);

  const playTrack = useCallback(async (spotifyId: string, positionMs: number = 0): Promise<boolean> => {
    const currentDeviceId = deviceId || window._spotifyDeviceId || (playerRef.current ? await playerRef.current.getCurrentState().then((s: any) => s?.device?.device_id) : null);
    if (!currentDeviceId) {
      console.warn("[SpotifySDK] No device_id, cannot play");
      return false;
    }

    try {
      const res = await fetch("/api/spotify/token");
      const { accessToken } = await res.json();

      const playRes = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${currentDeviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [`spotify:track:${spotifyId}`],
          position_ms: positionMs
        }),
      });

      if (!playRes.ok) {
        console.warn("[SpotifySDK] Play failed:", await playRes.text());
        return false;
      }
      return true;
    } catch (err) {
      console.warn("[SpotifySDK] Play error:", err);
      return false;
    }
  }, [deviceId]);

  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    playerRef.current?.resume();
  }, []);

  const seek = useCallback(async (positionMs: number) => {
    await playerRef.current?.seek(positionMs);
  }, []);

  return { isReady, deviceId, error, playTrack, pause, resume, seek };
}
