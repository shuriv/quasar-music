import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Search, User, LogOut, Heart, Clock, TrendingUp, Sparkles } from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2zJYCi7pppEsP_uDp-AZdkFAwMHpW6Ag",
  authDomain: "quasar-music.firebaseapp.com",
  projectId: "quasar-music",
  storageBucket: "quasar-music.firebasestorage.app",
  messagingSenderId: "219252189430",
  appId: "1:219252189430:web:adcc5fc0d541d1132264d7",
  measurementId: "G-58R9XKGTFK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const translations = {
  en: {
    appName: 'Quasar',
    tagline: 'Your cosmic music experience',
    login: 'Login',
    createAccount: 'Create Account',
    username: 'Username',
    password: 'Password',
    back: 'Back',
    logout: 'Logout',
    search: 'Search Results',
    favorites: 'Favorites',
    recentlyPlayed: 'Recently Played',
    searchPlaceholder: 'Search for songs, artists, albums...',
    searchButton: 'Search',
    searching: 'Searching...',
    noResults: 'Search for music to get started!',
    trySearching: 'Try searching for your favorite artists or songs',
    noFavorites: 'No favorites yet',
    startAdding: 'Start adding tracks to your favorites!',
    noRecent: 'No recently played tracks',
    historyAppears: 'Your listening history will appear here',
    loginToSave: 'Please login to save favorites',
    passwordTooShort: 'Password must be at least 6 characters',
    usernameTooShort: 'Username must be at least 3 characters',
    loginError: 'Login failed. Please check your credentials.',
    registerError: 'Registration failed. Username may already exist.',
    failedSearch: 'Failed to search music. Please try again.',
  },
  ru: {
    appName: 'Quasar',
    tagline: 'Ваш космический музыкальный опыт',
    login: 'Войти',
    createAccount: 'Создать аккаунт',
    username: 'Имя пользователя',
    password: 'Пароль',
    back: 'Назад',
    logout: 'Выйти',
    search: 'Результаты поиска',
    favorites: 'Избранное',
    recentlyPlayed: 'Недавно прослушанное',
    searchPlaceholder: 'Поиск песен, исполнителей, альбомов...',
    searchButton: 'Искать',
    searching: 'Поиск...',
    noResults: 'Начните поиск музыки!',
    trySearching: 'Попробуйте найти ваших любимых исполнителей или песни',
    noFavorites: 'Пока нет избранного',
    startAdding: 'Начните добавлять треки в избранное!',
    noRecent: 'Нет недавно прослушанных треков',
    historyAppears: 'Здесь появится история прослушивания',
    loginToSave: 'Войдите, чтобы сохранить избранное',
    passwordTooShort: 'Пароль должен содержать не менее 6 символов',
    usernameTooShort: 'Имя пользователя должно содержать не менее 3 символов',
    loginError: 'Ошибка входа. Проверьте учетные данные.',
    registerError: 'Ошибка регистрации. Имя пользователя может уже существовать.',
    failedSearch: 'Не удалось найти музыку. Попробуйте снова.',
  }
};

const MusicApp = () => {
  const [lang, setLang] = useState('en');
  const t = translations[lang];
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const [favorites, setFavorites] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [activeTab, setActiveTab] = useState('search');
  
  const audioRef = useRef(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        await loadUserData(firebaseUser.uid);
      } else {
        setUser(null);
        setFavorites([]);
        setRecentlyPlayed([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load user data from Firestore
  const loadUserData = async (uid) => {
    try {
      const favRef = doc(db, 'users', uid, 'data', 'favorites');
      const favSnap = await getDoc(favRef);
      if (favSnap.exists()) {
        setFavorites(favSnap.data().tracks || []);
      }

      const recentRef = doc(db, 'users', uid, 'data', 'recent');
      const recentSnap = await getDoc(recentRef);
      if (recentSnap.exists()) {
        setRecentlyPlayed(recentSnap.data().tracks || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Save favorites to Firestore
  useEffect(() => {
    const saveFavorites = async () => {
      if (user && favorites.length >= 0) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'data', 'favorites'), {
            tracks: favorites,
            updatedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error saving favorites:', error);
        }
      }
    };
    saveFavorites();
  }, [favorites, user]);

  // Save recently played to Firestore
  useEffect(() => {
    const saveRecent = async () => {
      if (user && recentlyPlayed.length >= 0) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'data', 'recent'), {
            tracks: recentlyPlayed,
            updatedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error saving recent:', error);
        }
      }
    };
    saveRecent();
  }, [recentlyPlayed, user]);

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('quasar_lang', newLang);
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('quasar_lang');
    if (savedLang) setLang(savedLang);
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (username.length < 3) {
      alert(t.usernameTooShort);
      return;
    }
    
    if (password.length < 6) {
      alert(t.passwordTooShort);
      return;
    }

    const email = `${username}@quasar.app`;
    
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setShowAuth(false);
      setUsername('');
      setPassword('');
    } catch (error) {
      console.error('Auth error:', error);
      if (authMode === 'login') {
        alert(t.loginError);
      } else {
        alert(t.registerError);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentTrack(null);
      setIsPlaying(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const searchMusic = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const allTracks = [];
    
    try {
      try {
        const jamendoResponse = await fetch(
          `https://api.jamendo.com/v3.0/tracks/?client_id=56d30c95&format=json&limit=15&search=${encodeURIComponent(searchQuery)}&audioformat=mp32`
        );
        const jamendoData = await jamendoResponse.json();
        
        if (jamendoData.results) {
          const jamendoTracks = jamendoData.results.map(track => ({
            id: `jamendo_${track.id}`,
            name: track.name,
            artist: track.artist_name,
            album: track.album_name,
            duration: track.duration,
            image: track.album_image || track.image,
            audioUrl: track.audio,
            source: 'Jamendo'
          }));
          allTracks.push(...jamendoTracks);
        }
      } catch (e) {
        console.error('Jamendo error:', e);
      }

      try {
        const jamendo2Response = await fetch(
          `https://api.jamendo.com/v3.0/tracks/?client_id=56d30c95&format=json&limit=10&namesearch=${encodeURIComponent(searchQuery)}&audioformat=mp32&order=popularity_total`
        );
        const jamendo2Data = await jamendo2Response.json();
        
        if (jamendo2Data.results) {
          const jamendo2Tracks = jamendo2Data.results
            .filter(track => !allTracks.some(t => t.name === track.name && t.artist === track.artist_name))
            .map(track => ({
              id: `jamendo2_${track.id}`,
              name: track.name,
              artist: track.artist_name,
              album: track.album_name,
              duration: track.duration,
              image: track.album_image || track.image,
              audioUrl: track.audio,
              source: 'Jamendo'
            }));
          allTracks.push(...jamendo2Tracks);
        }
      } catch (e) {
        console.error('Jamendo 2 error:', e);
      }

      try {
        const radioResponse = await fetch(
          `https://de1.api.radio-browser.info/json/stations/search?name=${encodeURIComponent(searchQuery)}&limit=5&has_extended_info=true`
        );
        const radioData = await radioResponse.json();
        
        if (radioData && radioData.length > 0) {
          const radioTracks = radioData
            .filter(station => station.url_resolved)
            .map(station => ({
              id: `radio_${station.stationuuid}`,
              name: station.name,
              artist: station.country || 'Live Radio',
              album: station.tags || 'Radio Station',
              duration: 0,
              image: station.favicon || 'https://via.placeholder.com/200?text=Radio',
              audioUrl: station.url_resolved,
              source: 'Radio'
            }));
          allTracks.push(...radioTracks);
        }
      } catch (e) {
        console.error('Radio error:', e);
      }

      setSearchResults(allTracks);
      
      if (allTracks.length === 0) {
        alert(t.failedSearch);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert(t.failedSearch);
    }
    setIsSearching(false);
  };

  const playTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    
    if (user) {
      const updatedRecent = [track, ...recentlyPlayed.filter(t => t.id !== track.id)].slice(0, 10);
      setRecentlyPlayed(updatedRecent);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleFavorite = (track) => {
    if (!user) {
      alert(t.loginToSave);
      return;
    }
    
    const isFavorite = favorites.some(f => f.id === track.id);
    if (isFavorite) {
      setFavorites(favorites.filter(f => f.id !== track.id));
    } else {
      setFavorites([...favorites, track]);
    }
  };

  const skipTrack = (direction) => {
    const currentList = activeTab === 'favorites' ? favorites : activeTab === 'recent' ? recentlyPlayed : searchResults;
    const currentIndex = currentList.findIndex(t => t.id === currentTrack?.id);
    
    if (direction === 'next' && currentIndex < currentList.length - 1) {
      playTrack(currentList[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      playTrack(currentList[currentIndex - 1]);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.audioUrl;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error('Play error:', e));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  const TrackCard = ({ track, onPlay, index }) => (
    <div 
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 hover:from-purple-900/30 hover:to-gray-800 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-purple-500/20 hover:scale-105 animate-fadeIn"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="relative mb-3 overflow-hidden rounded-lg">
        <img 
          src={track.image || 'https://via.placeholder.com/200?text=No+Image'} 
          alt={track.name}
          className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <button
          onClick={() => onPlay(track)}
          className="absolute bottom-3 right-3 bg-purple-600 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:bg-purple-500 hover:scale-110 transform translate-y-2 group-hover:translate-y-0"
        >
          <Play size={20} fill="white" className="text-white" />
        </button>
        {track.source && (
          <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-purple-300">
            {track.source}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">{track.name}</h3>
      <p className="text-sm text-gray-400 truncate">{track.artist}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">{track.duration ? formatTime(track.duration) : 'Live'}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(track);
          }}
          className={`${favorites.some(f => f.id === track.id) ? 'text-purple-500 scale-110' : 'text-gray-500'} hover:text-purple-400 transition-all duration-300 hover:scale-125`}
        >
          <Heart size={16} fill={favorites.some(f => f.id === track.id) ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center">
        <div className="text-center">
          <Sparkles size={48} className="text-purple-500 animate-pulse mx-auto mb-4" />
          <p className="text-white text-lg">Loading Quasar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-twinkle"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 3 + 's',
                animationDuration: Math.random() * 2 + 2 + 's'
              }}
            />
          ))}
        </div>
        
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl border border-purple-500/20 relative z-10 animate-slideUp">
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={() => changeLang('en')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                lang === 'en' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => changeLang('ru')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                lang === 'ru' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              RU
            </button>
          </div>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-4 animate-pulse-slow shadow-lg shadow-purple-500/50">
              <Sparkles size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
              {t.appName}
            </h1>
            <p className="text-gray-400">{t.tagline}</p>
          </div>
          
          {!showAuth ? (
            <div className="space-y-3">
              <button
                onClick={() => { setShowAuth(true); setAuthMode('login'); }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 hover:scale-105"
              >
                {t.login}
              </button>
              <button
                onClick={() => { setShowAuth(true); setAuthMode('register'); }}
                className="w-full bg-gray-800 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all duration-300 border border-gray-700 hover:border-purple-500"
              >
                {t.createAccount}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.username}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAuth(e)}
                  className="w-full bg-gray-800/50 backdrop-blur text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 border border-gray-700 transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.password}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAuth(e)}
                  className="w-full bg-gray-800/50 backdrop-blur text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 border border-gray-700 transition-all duration-300"
                />
              </div>
              <button
                onClick={handleAuth}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:scale-105"
              >
                {authMode === 'login' ? t.login : t.createAccount}
              </button>
              <button
                onClick={() => setShowAuth(false)}
                className="w-full text-gray-400 py-2 hover:text-white transition-colors"
              >
                {t.back}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 text-white pb-32 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-float"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 10 + 10 + 's',
              opacity: Math.random() * 0.3 + 0.1
            }}
          />
        ))}
      </div>

      <header className="bg-gray-900/80 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 animate-slideRight">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-xl shadow-lg shadow-purple-500/50 animate-pulse-slow">
              <Sparkles size={24} />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t.appName}
            </h1>
          </div>
          <div className="flex items-center space-x-4 animate-slideLeft">
            <div className="flex space-x-2">
              <button
                onClick={() => changeLang('en')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                  lang === 'en' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => changeLang('ru')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                  lang === 'ru' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                RU
              </button>
            </div>
            <span className="text-gray-300 flex items-center space-x-2 bg-gray-800/50 px-3 py-2 rounded-lg">
              <User size={20} />
              <span>{user.email?.split('@')[0]}</span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-gray-800 px-4 py-2 rounded-lg hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center space-x-2 border border-gray-700 hover:border-transparent"
            >
              <LogOut size={18} />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        <div className="mb-6 animate-fadeIn">
          <div className="flex space-x-2">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchMusic()}
                placeholder={t.searchPlaceholder}
                className="w-full bg-gray-900/50 backdrop-blur-xl text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 border border-gray-800 focus:border-purple-500 transition-all duration-300"
              />
            </div>
            <button
              onClick={searchMusic}
              disabled={isSearching}
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-purple-500/50 hover:scale-105"
            >
              {isSearching ? t.searching : t.searchButton}
            </button>
          </div>
        </div>

        <div className="flex space-x-4 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-3 px-2 font-semibold transition-all duration-300 flex items-center space-x-2 ${
              activeTab === 'search' ? 'text-purple-400 border-b-2 border-purple-400 scale-105' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Search size={18} />
            <span>{t.search}</span>
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`pb-3 px-2 font-semibold transition-all duration-300 flex items-center space-x-2 ${
              activeTab === 'favorites' ? 'text-purple-400 border-b-2 border-purple-400 scale-105' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Heart size={18} />
            <span>{t.favorites} ({favorites.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`pb-3 px-2 font-semibold transition-all duration-300 flex items-center space-x-2 ${
              activeTab === 'recent' ? 'text-purple-400 border-b-2 border-purple-400 scale-105' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock size={18} />
            <span>{t.recentlyPlayed}</span>
          </button>
        </div>

        <div>
          {activeTab === 'search' && (
            <>
              {searchResults.length === 0 && !isSearching && (
                <div className="text-center py-20 animate-fadeIn">
                  <TrendingUp size={64} className="mx-auto mb-4 text-purple-500/30 animate-bounce-slow" />
                  <p className="text-gray-400 text-lg">{t.noResults}</p>
                  <p className="text-gray-500 text-sm mt-2">{t.trySearching}</p>
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {searchResults.map((track, index) => (
                    <TrackCard key={track.id} track={track} onPlay={playTrack} index={index} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'favorites' && (
            <>
              {favorites.length === 0 ? (
                <div className="text-center py-20 animate-fadeIn">
                  <Heart size={64} className="mx-auto mb-4 text-purple-500/30 animate-pulse-slow" />
                  <p className="text-gray-400 text-lg">{t.noFavorites}</p>
                  <p className="text-gray-500 text-sm mt-2">{t.startAdding}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {favorites.map((track, index) => (
                    <TrackCard key={track.id} track={track} onPlay={playTrack} index={index} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'recent' && (
            <>
              {recentlyPlayed.length === 0 ? (
                <div className="text-center py-20 animate-fadeIn">
                  <Clock size={64} className="mx-auto mb-4 text-purple-500/30 animate-spin-slow" />
                  <p className="text-gray-400 text-lg">{t.noRecent}</p>
                  <p className="text-gray-500 text-sm mt-2">{t.historyAppears}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {recentlyPlayed.map((track, index) => (
                    <TrackCard key={track.id} track={track} onPlay={playTrack} index={index} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-purple-500/20 p-4 shadow-2xl animate-slideUp z-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4 w-64">
                <img 
                  src={currentTrack.image || 'https://via.placeholder.com/64?text=No+Image'} 
                  alt={currentTrack.name}
                  className="w-16 h-16 rounded-lg shadow-lg animate-spin-slow"
                  style={{ animationDuration: '20s' }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate text-white">{currentTrack.name}</h4>
                  <p className="text-sm text-gray-400 truncate">{currentTrack.artist}</p>
                </div>
                <button
                  onClick={() => toggleFavorite(currentTrack)}
                  className={`${favorites.some(f => f.id === currentTrack.id) ? 'text-purple-500 scale-110' : 'text-gray-400'} hover:text-purple-400 transition-all duration-300 hover:scale-125`}
                >
                  <Heart size={20} fill={favorites.some(f => f.id === currentTrack.id) ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => skipTrack('prev')} 
                    className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                  >
                    <SkipBack size={24} />
                  </button>
                  <button 
                    onClick={togglePlay}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-full hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:scale-110"
                  >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                  </button>
                  <button 
                    onClick={() => skipTrack('next')} 
                    className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                  >
                    <SkipForward size={24} />
                  </button>
                </div>
                
                <div className="w-full flex items-center space-x-2">
                  <span className="text-xs text-gray-400 w-12 text-right">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-gray-400 w-12">{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-32">
                <button 
                  onClick={toggleMute} 
                  className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                >
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => skipTrack('next')}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideLeft {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-30px) translateX(5px);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }

        .animate-slideRight {
          animation: slideRight 0.5s ease-out;
        }

        .animate-slideLeft {
          animation: slideLeft 0.5s ease-out;
        }

        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }

        .animate-float {
          animation: float 15s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          background: linear-gradient(to right, #9333ea, #ec4899);
          cursor: pointer;
          border-radius: 50%;
          transition: all 0.3s ease;
          box-shadow: 0 0 10px rgba(147, 51, 234, 0.5);
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.3);
          box-shadow: 0 0 15px rgba(147, 51, 234, 0.8);
        }

        .slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: linear-gradient(to right, #9333ea, #ec4899);
          cursor: pointer;
          border-radius: 50%;
          border: none;
          transition: all 0.3s ease;
          box-shadow: 0 0 10px rgba(147, 51, 234, 0.5);
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.3);
          box-shadow: 0 0 15px rgba(147, 51, 234, 0.8);
        }

        .slider::-webkit-slider-runnable-track {
          background: linear-gradient(to right, #9333ea 0%, #9333ea ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%);
          height: 4px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default MusicApp;