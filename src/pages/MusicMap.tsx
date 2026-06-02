import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Music, MapPin, Trash2, Loader2, Heart, Search, X, Play, Pause, Volume2, VolumeX, Globe2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Color palette per pin (deterministic from id)
const PIN_COLORS = [
  ['hsl(270, 80%, 60%)', 'hsl(290, 75%, 55%)'],
  ['hsl(340, 85%, 60%)', 'hsl(10, 85%, 60%)'],
  ['hsl(200, 90%, 55%)', 'hsl(220, 85%, 55%)'],
  ['hsl(150, 70%, 45%)', 'hsl(180, 75%, 45%)'],
  ['hsl(35, 95%, 55%)', 'hsl(15, 90%, 55%)'],
  ['hsl(50, 95%, 55%)', 'hsl(80, 75%, 50%)'],
];

const colorFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PIN_COLORS[h % PIN_COLORS.length];
};

const buildIcon = (id: string, dark = false) => {
  const [c1, c2] = colorFor(id);
  const opacity = dark ? 0.65 : 1;
  const glowAlpha = dark ? 0.18 : 0.5;
  const ringColor = dark ? 'rgba(255,255,255,0.35)' : 'white';
  const shadow = dark ? '0 2px 8px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.4)';
  return L.divIcon({
    className: 'music-pin-icon',
    html: `
      <div style="position:relative;width:36px;height:36px;transform:translate(-50%,-100%);opacity:${opacity};">
        <div style="position:absolute;inset:0;background:radial-gradient(circle, ${c1.replace('hsl', 'hsla').replace(')', `, ${glowAlpha})`)}, transparent 70%);filter:blur(6px);"></div>
        <div style="position:relative;width:36px;height:36px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg, ${c1}, ${c2});transform:rotate(-45deg);box-shadow:${shadow}, 0 0 0 2px ${ringColor};display:flex;align-items:center;justify-content:center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg);">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
        </div>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [0, 0],
  });
};

const isDirectAudio = (url: string) => /\.(mp3|m4a|ogg|wav|aac|flac|opus)(\?|#|$)/i.test(url);

interface MusicPin {
  id: string;
  user_id: string;
  user_name: string;
  song_title: string;
  artist: string | null;
  quote: string | null;
  song_url: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface NewPinDraft {
  latitude: number;
  longitude: number;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function MapFlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 16, { duration: 1.2 });
  }, [target, map]);
  return null;
}

// Convert Spotify/YouTube share URL to embed URL
const toEmbed = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (u.hostname.includes('spotify.com')) {
      // https://open.spotify.com/track/xyz -> https://open.spotify.com/embed/track/xyz
      const path = u.pathname.replace(/^\/(intl-[a-z]+\/)?/, '/');
      return `https://open.spotify.com/embed${path}?autoplay=1`;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}?autoplay=1`;
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}?autoplay=1`;
    }
    if (u.hostname.includes('soundcloud.com')) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true`;
    }
  } catch {}
  return null;
};

const fmtTime = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
};

function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
    a.muted = muted;
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);
  useEffect(() => { if (audioRef.current) audioRef.current.muted = muted; }, [muted]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
  };

  const seek = (val: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = val;
    setCur(val);
  };

  return (
    <div className="px-4 py-3 space-y-2">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={(e) => setCur((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={(e) => setDur((e.target as HTMLAudioElement).duration)}
        onEnded={() => setPlaying(false)}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="h-10 w-10 rounded-full bg-primary/15 hover:bg-primary/25 text-primary flex items-center justify-center shrink-0 transition"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-muted-foreground tabular-nums mb-1">
            {fmtTime(cur)} / {fmtTime(dur)}
          </div>
          <input
            type="range"
            min={0}
            max={dur || 0}
            step={0.1}
            value={cur}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full h-1 accent-primary cursor-pointer"
          />
        </div>
        <button
          onClick={() => setMuted((m) => !m)}
          className="text-muted-foreground hover:text-foreground shrink-0"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
          className="w-16 h-1 accent-primary cursor-pointer shrink-0"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}

const MusicMap = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [pins, setPins] = useState<MusicPin[]>([]);
  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<NewPinDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [activePin, setActivePin] = useState<MusicPin | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [placeLoading, setPlaceLoading] = useState(false);

  const [songTitle, setSongTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [quote, setQuote] = useState('');
  const [songUrl, setSongUrl] = useState('');

  const initialCenter = useMemo<[number, number]>(() => [16.0354, 120.2683], []);

  // Detect dark mode (and react to changes)
  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains('dark'));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: pinsData, error: pinsErr }, { data: likesData }] = await Promise.all([
      supabase.from('music_pins').select('*').order('created_at', { ascending: false }),
      supabase.from('music_pin_likes').select('pin_id, user_id'),
    ]);
    if (pinsErr) {
      toast({ title: 'Could not load pins', description: pinsErr.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    setPins((pinsData || []) as MusicPin[]);
    const map: Record<string, { count: number; liked: boolean }> = {};
    (likesData || []).forEach((l: any) => {
      if (!map[l.pin_id]) map[l.pin_id] = { count: 0, liked: false };
      map[l.pin_id].count++;
      if (user && l.user_id === user.id) map[l.pin_id].liked = true;
    });
    setLikes(map);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user?.id]);

  const handleMapClick = (lat: number, lng: number) => {
    if (!user) { toast({ title: 'Please sign in to drop a pin' }); return; }
    setDraft({ latitude: lat, longitude: lng });
    setSongTitle(''); setArtist(''); setQuote(''); setSongUrl('');
  };

  const handleSubmit = async () => {
    if (!user || !profile || !draft) return;
    if (!songTitle.trim()) {
      toast({ title: 'Song title is required', variant: 'destructive' }); return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from('music_pins')
      .insert({
        user_id: user.id,
        user_name: profile.name,
        song_title: songTitle.trim(),
        artist: artist.trim() || null,
        quote: quote.trim() || null,
        song_url: songUrl.trim() || null,
        latitude: draft.latitude,
        longitude: draft.longitude,
      })
      .select().single();
    setSubmitting(false);
    if (error) {
      toast({ title: 'Could not save pin', description: error.message, variant: 'destructive' }); return;
    }
    setPins((prev) => [data as MusicPin, ...prev]);
    setDraft(null);
    toast({ title: '🎵 Pin dropped!', description: 'Your song is now on the map.' });
  };

  const handleDelete = async (pin: MusicPin) => {
    if (!user || pin.user_id !== user.id) return;
    const { error } = await supabase.from('music_pins').delete().eq('id', pin.id);
    if (error) {
      toast({ title: 'Could not delete', description: error.message, variant: 'destructive' }); return;
    }
    setPins((prev) => prev.filter((p) => p.id !== pin.id));
    toast({ title: 'Pin removed' });
  };

  const toggleLike = async (pin: MusicPin) => {
    if (!user) { toast({ title: 'Please sign in to like' }); return; }
    const current = likes[pin.id] || { count: 0, liked: false };
    // optimistic
    setLikes((prev) => ({
      ...prev,
      [pin.id]: { count: current.count + (current.liked ? -1 : 1), liked: !current.liked },
    }));
    if (current.liked) {
      const { error } = await supabase
        .from('music_pin_likes')
        .delete()
        .eq('pin_id', pin.id)
        .eq('user_id', user.id);
      if (error) {
        setLikes((prev) => ({ ...prev, [pin.id]: current }));
        toast({ title: 'Could not unlike', variant: 'destructive' });
      }
    } else {
      const { error } = await supabase
        .from('music_pin_likes')
        .insert({ pin_id: pin.id, user_id: user.id });
      if (error) {
        setLikes((prev) => ({ ...prev, [pin.id]: current }));
        toast({ title: 'Could not like', variant: 'destructive' });
      }
    }
  };

  // Search filter + handler
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return pins.filter((p) =>
      p.song_title.toLowerCase().includes(q) ||
      (p.artist || '').toLowerCase().includes(q) ||
      p.user_name.toLowerCase().includes(q) ||
      (p.quote || '').toLowerCase().includes(q),
    ).slice(0, 8);
  }, [search, pins]);

  const goToPin = (p: MusicPin) => {
    setSearch('');
    setFlyTo([p.latitude, p.longitude]);
    setActivePin(p);
  };

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const searchPlaces = async () => {
    const q = placeQuery.trim();
    if (!q) return;
    setPlaceLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`,
        { headers: { 'Accept': 'application/json' } },
      );
      const data = await res.json();
      setPlaceResults(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({ title: 'Could not search places', variant: 'destructive' });
    } finally {
      setPlaceLoading(false);
    }
  };

  const goToPlace = (lat: string, lon: string, name: string) => {
    const la = parseFloat(lat), lo = parseFloat(lon);
    if (!isFinite(la) || !isFinite(lo)) return;
    setFlyTo([la, lo]);
    setPlaceResults([]);
    setPlaceQuery(name.split(',')[0]);
    if (user) setDraft({ latitude: la, longitude: lo });
    toast({ title: '📍 Location found', description: 'Tap the map to fine-tune, or fill the form.' });
  };

  const directAudio = activePin?.song_url && isDirectAudio(activePin.song_url) ? activePin.song_url : null;
  const embedUrl = activePin?.song_url && !directAudio ? toEmbed(activePin.song_url) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-[1000] bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 py-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Music className="h-5 w-5 text-primary" />
            <div className="min-w-0">
              <h1 className="text-base font-bold leading-tight">Music Map</h1>
              <p className="text-[11px] text-muted-foreground truncate">Tap the map to pin a song</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {loading ? '...' : `${pins.length}`}
          </div>
        </div>
        {/* Search bar */}
        <div className="px-4 pb-3 relative">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search song, artist, or person..."
              className="pl-8 pr-8 h-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {matches.length > 0 && (
            <div className="absolute left-4 right-4 mt-1 bg-popover border rounded-md shadow-lg z-[1100] max-h-72 overflow-auto">
              {matches.map((p) => (
                <button
                  key={p.id}
                  onClick={() => goToPin(p)}
                  className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 border-b last:border-0"
                >
                  <Music className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{p.song_title}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {p.artist ? `${p.artist} · ` : ''}pinned by {p.user_name}
                    </div>
                  </div>
                  <Heart className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{likes[p.id]?.count || 0}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Place search */}
        <div className="px-4 pb-3 relative">
          <div className="relative">
            <Globe2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={placeQuery}
              onChange={(e) => setPlaceQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchPlaces(); } }}
              placeholder="Search a place to pin (e.g., 'Eiffel Tower')..."
              className="pl-8 pr-20 h-9"
            />
            {placeQuery && (
              <button
                onClick={() => { setPlaceQuery(''); setPlaceResults([]); }}
                className="absolute right-16 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Button
              size="sm" onClick={searchPlaces} disabled={placeLoading}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
            >
              {placeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Find'}
            </Button>
          </div>
          {placeResults.length > 0 && (
            <div className="absolute left-4 right-4 mt-1 bg-popover border rounded-md shadow-lg z-[1100] max-h-72 overflow-auto">
              {placeResults.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => goToPlace(r.lat, r.lon, r.display_name)}
                  className="w-full text-left px-3 py-2 hover:bg-accent flex items-start gap-2 border-b last:border-0"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs">{r.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 relative">
        <MapContainer
          center={initialCenter}
          zoom={14}
          scrollWheelZoom
          style={{ height: 'calc(100vh - 110px)', width: '100%' }}
        >
          <TileLayer
            key={isDark ? 'dark' : 'light'}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url={tileUrl}
          />
          <ClickHandler onClick={handleMapClick} />
          <MapFlyTo target={flyTo} />
          {pins.map((pin) => {
            const stat = likes[pin.id] || { count: 0, liked: false };
            return (
              <Marker
                key={`${pin.id}-${isDark ? 'd' : 'l'}`}
                position={[pin.latitude, pin.longitude]}
                icon={buildIcon(pin.id, isDark)}
                eventHandlers={{ popupopen: () => setActivePin(pin), popupclose: () => setActivePin((p) => p?.id === pin.id ? null : p) }}
              >
                <Popup>
                  <div className="space-y-1 min-w-[220px]">
                    <div className="font-semibold text-sm flex items-center gap-1">
                      <Music className="h-3.5 w-3.5 text-primary" />
                      {pin.song_title}
                    </div>
                    {pin.artist && <div className="text-xs text-muted-foreground">by {pin.artist}</div>}
                    {pin.quote && (
                      <p className="text-xs italic border-l-2 border-primary/40 pl-2 my-2">"{pin.quote}"</p>
                    )}
                    {pin.song_url && !toEmbed(pin.song_url) && (
                      <a href={pin.song_url} target="_blank" rel="noopener noreferrer"
                         className="text-xs text-primary underline block">🎧 Listen</a>
                    )}
                    {pin.song_url && toEmbed(pin.song_url) && (
                      <p className="text-[10px] text-muted-foreground">▶ Auto-playing below</p>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t mt-1">
                      <div className="text-[10px] text-muted-foreground">
                        by <span className="font-medium">{pin.user_name}</span>
                      </div>
                      <button
                        onClick={() => toggleLike(pin)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition ${
                          stat.liked ? 'bg-rose-500/10 text-rose-500' : 'hover:bg-accent text-muted-foreground'
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${stat.liked ? 'fill-current' : ''}`} />
                        {stat.count}
                      </button>
                    </div>
                    {user?.id === pin.user_id && (
                      <button onClick={() => handleDelete(pin)}
                        className="mt-1 text-[11px] text-destructive flex items-center gap-1 hover:underline">
                        <Trash2 className="h-3 w-3" /> Remove my pin
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating tip */}
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-[500]">
          <div className="bg-background/90 backdrop-blur border rounded-full px-4 py-2 shadow-lg text-xs flex items-center gap-2">
            <Music className="h-3.5 w-3.5 text-primary" />
            <span>Tap the map to pin · tap a pin to play 🎵</span>
          </div>
        </div>

        {/* Auto-play player */}
        {activePin && (embedUrl || directAudio) && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[600] w-[min(360px,calc(100%-2rem))] bg-background/95 backdrop-blur border rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <div className="text-xs font-semibold truncate flex items-center gap-1">
                <Music className="h-3.5 w-3.5 text-primary" /> {activePin.song_title}
              </div>
              <button onClick={() => setActivePin(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {directAudio ? (
              <AudioPlayer src={directAudio} />
            ) : (
              <iframe
                key={activePin.id}
                src={embedUrl!}
                width="100%"
                height={embedUrl!.includes('spotify') ? '152' : '180'}
                frameBorder={0}
                allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
                loading="lazy"
              />
            )}
          </div>
        )}
      </div>

      <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="z-[1100]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" /> Drop a song here
            </DialogTitle>
            <DialogDescription>Share what you're vibing to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="song">Song title *</Label>
              <Input id="song" value={songTitle} onChange={(e) => setSongTitle(e.target.value)}
                placeholder="e.g. Blinding Lights" maxLength={120} />
            </div>
            <div>
              <Label htmlFor="artist">Artist</Label>
              <Input id="artist" value={artist} onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. The Weeknd" maxLength={120} />
            </div>
            <div>
              <Label htmlFor="quote">Quote / lyric / message</Label>
              <Textarea id="quote" value={quote} onChange={(e) => setQuote(e.target.value)}
                placeholder="A favorite line, a feeling..." maxLength={280} rows={3} />
              <p className="text-[10px] text-muted-foreground mt-1">{quote.length}/280</p>
            </div>
            <div>
              <Label htmlFor="url">Spotify / YouTube link (auto-plays)</Label>
              <Input id="url" type="url" value={songUrl} onChange={(e) => setSongUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/... or https://youtu.be/..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDraft(null)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Drop pin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MusicMap;
