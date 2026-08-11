import { useEffect, useRef, useState } from "react";
import "./App.css";

const journeys = [
  {
    id: "truck",
    title: "Truck Drive",
    subtitle: "Long haul radio",
    icon: "🚛",
    video: `${import.meta.env.BASE_URL}/videos/truck.mp4`,
    playlist: "PLgObA3pAqvOh87Z03QG8Z4xE-uqlAWSBy",
  },
  {
    id: "bus",
    title: "Bus Trip",
    subtitle: "A ride through the night",
    icon: "🚌",
    video: `${import.meta.env.BASE_URL}/videos/bus.mp4`,
    playlist: "PLDEqvCb9K2evL_kNHmKn9AZiug0EG1PsI",
  },
  {
    id: "night",
    title: "Night Drive",
    subtitle: "City lights & late nights",
    icon: "🚗",
    video: `${import.meta.env.BASE_URL}/videos/night-drive.mp4`,
    playlist: "PLAhy0J4-jSMXF2rxI7Rl_qfmLW8AzStvl",
  },
  {
    id: "train",
    title: "Train Journey",
    subtitle: "Watch the world go by",
    icon: "🚆",
    video: `${import.meta.env.BASE_URL}/videos/train.mp4`,
    playlist: "PLluqBUTOXDHUjNguM2wgfaVJhC0OHTTqB",
  },
];

function App() {
  const [selectedJourney, setSelectedJourney] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [trackTitle, setTrackTitle] = useState("Loading radio...");
  const [isShuffle, setIsShuffle] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const playerRef = useRef(null);
  const youtubeApiLoaded = useRef(false);

  /*
   * Load YouTube IFrame API
   */
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      youtubeApiLoaded.current = true;
      return;
    }

    if (document.getElementById("youtube-iframe-api")) {
      return;
    }

    const script = document.createElement("script");

    script.id = "youtube-iframe-api";
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;

    document.body.appendChild(script);
  }, []);

  /*
   * Create YouTube player whenever journey changes
   */
  useEffect(() => {
    if (!selectedJourney) {
      return;
    }

    let cancelled = false;

    const createPlayer = () => {
      if (cancelled) return;

      if (!window.YT || !window.YT.Player) {
        setTimeout(createPlayer, 100);
        return;
      }

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup errors
        }

        playerRef.current = null;
      }

      playerRef.current = new window.YT.Player("youtube-player", {
        width: "200",
        height: "200",

        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          rel: 0,
          loop: 1,
          listType: "playlist",
          list: selectedJourney.playlist,
          origin: window.location.origin,
        },

        events: {
          onReady: handlePlayerReady,
          onStateChange: handlePlayerStateChange,
          onError: handlePlayerError,
        },
      });
    };

    createPlayer();

    return () => {
      cancelled = true;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup errors
        }

        playerRef.current = null;
      }
    };
  }, [selectedJourney]);

  /*
   * YouTube player ready
   */
  const handlePlayerReady = (event) => {
    setIsReady(true);

    event.target.setVolume(volume);

    const playlist = event.target.getPlaylist();

    if (playlist && playlist.length > 0) {
      setCurrentTrack(event.target.getPlaylistIndex() || 0);

      updateTrackInformation(event.target);
    }

    event.target.playVideo();
  };

  /*
   * YouTube state changes
   */
  const handlePlayerStateChange = (event) => {
    const player = event.target;

    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);

      updateTrackInformation(player);
    }

    if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    }

    if (event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
    }

    if (
      event.data === window.YT.PlayerState.BUFFERING ||
      event.data === window.YT.PlayerState.CUED
    ) {
      updateTrackInformation(player);
    }
  };

  const handlePlayerError = () => {
    setTrackTitle("This track cannot be played");
  };

  /*
   * Read current YouTube video information
   */
  const updateTrackInformation = (player) => {
    try {
      const videoData = player.getVideoData();

      if (videoData && videoData.title) {
        setTrackTitle(videoData.title);
      }

      const index = player.getPlaylistIndex();

      if (typeof index === "number" && index >= 0) {
        setCurrentTrack(index);
      }
    } catch {
      // Information may not be ready yet
    }
  };

  /*
   * Start a journey
   */
  const startJourney = (journey) => {
    setSelectedJourney(journey);
    setIsPlaying(false);
    setIsReady(false);
    setTrackTitle("Loading radio...");
    setCurrentTrack(0);
  };

  /*
   * Go home
   */
  const exitJourney = () => {
    if (playerRef.current) {
      try {
        playerRef.current.stopVideo();
        playerRef.current.destroy();
      } catch {
        // Ignore cleanup errors
      }

      playerRef.current = null;
    }

    setSelectedJourney(null);
    setIsPlaying(false);
    setIsReady(false);
  };

  /*
   * Play / pause
   */
  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  /*
   * Next track
   */
  const nextTrack = () => {
    if (!playerRef.current) return;

    playerRef.current.nextVideo();

    setTimeout(() => {
      updateTrackInformation(playerRef.current);
    }, 500);
  };

  /*
   * Previous track
   */
  const previousTrack = () => {
    if (!playerRef.current) return;

    playerRef.current.previousVideo();

    setTimeout(() => {
      updateTrackInformation(playerRef.current);
    }, 500);
  };

  /*
   * Shuffle
   */
  const toggleShuffle = () => {
    if (!playerRef.current) return;

    const newValue = !isShuffle;

    playerRef.current.setShuffle(newValue);

    setIsShuffle(newValue);
  };

  /*
   * Volume
   */
  const changeVolume = (value) => {
    const newVolume = Number(value);

    setVolume(newVolume);

    if (!playerRef.current) return;

    playerRef.current.setVolume(newVolume);

    if (newVolume === 0) {
      playerRef.current.mute();
      setIsMuted(true);
    } else {
      playerRef.current.unMute();
      setIsMuted(false);
    }
  };

  /*
   * Mute
   */
  const toggleMute = () => {
    if (!playerRef.current) return;

    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume || 80);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  /*
   * Fullscreen
   */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  /*
   * HOME
   */
  if (!selectedJourney) {
    return (
      <div className="home">
        <div className="home-overlay" />

        <header className="navbar">
          <div className="logo">
            ROAD<span>RADIO</span>
          </div>

          <div className="radio-status">
            <span className="live-dot" />
            RADIO ONLINE
          </div>
        </header>

        <main className="home-content">
          <p className="eyebrow">MUSIC FOR THE JOURNEY</p>

          <h1>
            Where are
            <br />
            you going?
          </h1>

          <p className="description">
            Pick a ride. We'll handle the music.
          </p>

          <div className="journey-grid">
            {journeys.map((journey) => (
              <button
                className="journey-card"
                key={journey.id}
                onClick={() => startJourney(journey)}
              >
                <div className="card-icon">{journey.icon}</div>

                <div className="card-info">
                  <h2>{journey.title}</h2>
                  <p>{journey.subtitle}</p>
                </div>

                <div className="card-arrow">↗</div>
              </button>
            ))}
          </div>

          <div className="home-footer">
            <span>🎵</span>
            <span>ROAD RADIO</span>
            <span>•</span>
            <span>JUST PRESS PLAY</span>
          </div>
        </main>
      </div>
    );
  }

  /*
   * PLAYER
   */
  return (
    <div className="player">
      {/* Background journey video */}

      <video
        className="background-video"
        src={selectedJourney.video}
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="video-dark-overlay" />

      {/* Invisible / minimized YouTube API player */}

      <div
        className="youtube-hidden"
        aria-hidden="true"
      >
        <div id="youtube-player" />
      </div>

      {/* TOP */}

      <div className="player-top">
        <button
          className="round-button"
          onClick={exitJourney}
          aria-label="Back"
        >
          ←
        </button>

        <div className="journey-name">
          <span>{selectedJourney.icon}</span>

          {selectedJourney.title}
        </div>

        <button
          className="round-button"
          onClick={toggleFullscreen}
          aria-label="Fullscreen"
        >
          ⛶
        </button>
      </div>

      {/* CENTER */}

      <div className="player-center">
        <div className="radio-pill">
          <span className="live-dot" />

          {isReady ? "ROAD RADIO" : "CONNECTING RADIO"}
        </div>

        <h1>{selectedJourney.title}</h1>

        <p>Your journey. Your music.</p>
      </div>

      {/* CUSTOM MUSIC PLAYER */}

      <div className="music-player">
        <div className="track-section">
          <div className="album-art">
            {selectedJourney.icon}
          </div>

          <div className="track-information">
            <div className="track-label">
              NOW PLAYING
            </div>

            <div className="track-title">
              {trackTitle}
            </div>

            <div className="track-source">
              Retro Radio
            </div>
          </div>
        </div>

        <div className="player-controls">
          <button
            className={`control-button ${
              isShuffle ? "active" : ""
            }`}
            onClick={toggleShuffle}
            aria-label="Shuffle"
          >
            🔀
          </button>

          <button
            className="control-button"
            onClick={previousTrack}
            aria-label="Previous"
          >
            ⏮
          </button>

          <button
            className="play-button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "Ⅱ" : "▶"}
          </button>

          <button
            className="control-button"
            onClick={nextTrack}
            aria-label="Next"
          >
            ⏭
          </button>

          <button
            className="control-button"
            onClick={toggleMute}
            aria-label="Mute"
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
        </div>

        <div className="volume-section">
          <span>VOL</span>

          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(event) =>
              changeVolume(event.target.value)
            }
          />
        </div>

        <div className="playlist-position">
          TRACK {currentTrack + 1}
        </div>
      </div>
    </div>
  );
}

export default App;

