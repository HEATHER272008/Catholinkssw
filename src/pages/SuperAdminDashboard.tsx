import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Shield, Eye, MessageSquare, Terminal, Activity, Camera, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIAssistant from '@/components/jarvis/AIAssistant';
import HUDOverlay from '@/components/jarvis/HUDOverlay';
import SystemStatus from '@/components/jarvis/SystemStatus';
import CommandHistory, { CommandEntry } from '@/components/jarvis/CommandHistory';
import JarvisRing from '@/components/jarvis/JarvisRing';
import DataGrid from '@/components/jarvis/DataGrid';
import HoloPanel from '@/components/jarvis/HoloPanel';
import ParticleField from '@/components/jarvis/ParticleField';
import BootSequence from '@/components/jarvis/BootSequence';
import jarvisLogo from '@/assets/jarvis-logo.webp';
import { toast } from 'sonner';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [suitMode, setSuitMode] = useState(false);
  const [gestureEnabled, setGestureEnabled] = useState(false);
  const [commands, setCommands] = useState<CommandEntry[]>([]);
  const [activePanel, setActivePanel] = useState<'ai' | 'hud' | 'status' | 'commands'>('ai');
  // Only play the cinematic boot once per browser session — repeat visits skip
  // straight to the dashboard so it feels instant.
  const [booted, setBooted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('jarvis_booted') === '1';
  });

  const handleBootComplete = useCallback(() => {
    try { sessionStorage.setItem('jarvis_booted', '1'); } catch {}
    setBooted(true);
  }, []);
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const addCommand = useCallback((command: string, response: string, type: 'user' | 'system' = 'user') => {
    setCommands(prev => [{ timestamp: new Date(), command, response, type }, ...prev]);
  }, []);

  const handleGestureAction = useCallback((gesture: string) => {
    switch (gesture) {
      case 'open_palm':
        if (!isScanning) { setIsScanning(true); addCommand('GESTURE: PALM', 'Scanner activated via gesture', 'system'); toast.info('🖐️ Scanner activated'); }
        break;
      case 'swipe_left':
        setActivePanel(p => { const panels: typeof p[] = ['ai', 'hud', 'status', 'commands']; return panels[(panels.indexOf(p) + 1) % panels.length]; });
        addCommand('GESTURE: SWIPE', 'Panel switched', 'system');
        break;
      case 'swipe_right':
        setActivePanel(p => { const panels: typeof p[] = ['ai', 'hud', 'status', 'commands']; return panels[(panels.indexOf(p) - 1 + panels.length) % panels.length]; });
        addCommand('GESTURE: SWIPE', 'Panel switched', 'system');
        break;
      case 'swipe_up':
        setSuitMode(s => !s);
        addCommand('GESTURE: SWIPE UP', 'Suit mode toggled', 'system');
        break;
    }
  }, [isScanning, addCommand]);

  const handleCommand = useCallback((command: string) => {
    switch (command) {
      case 'camera': setCameraActive(true); addCommand('OPEN CAMERA', 'Camera feed activated', 'system'); break;
      case 'scan': setCameraActive(true); setIsScanning(true); addCommand('START SCAN', 'Scanning mode engaged', 'system'); break;
      case 'suit': setSuitMode(s => !s); addCommand('SUIT MODE', `Suit mode ${suitMode ? 'deactivated' : 'activated'}`, 'system'); break;
      case 'gesture': setGestureEnabled(g => !g); addCommand('GESTURE CTRL', `Gesture control ${gestureEnabled ? 'disabled' : 'enabled'}`, 'system'); break;
      case 'hologram': setCameraActive(true); setIsScanning(true); setSuitMode(true); addCommand('HOLOGRAM MODE', 'Full holographic suite activated', 'system'); break;
      case 'status': setActivePanel('status'); addCommand('SYSTEM STATUS', 'Displaying system diagnostics', 'system'); break;
      case 'dashboard': navigate('/dashboard'); addCommand('SHOW DASHBOARD', 'Navigating to main dashboard', 'system'); break;
      case 'stop': setCameraActive(false); setIsScanning(false); setSuitMode(false); addCommand('STOP', 'Systems standing down', 'system'); break;
    }
  }, [addCommand, navigate, suitMode, gestureEnabled]);

  const handleSignOut = async () => { await signOut(); navigate('/auth'); };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-cyan-100 overflow-hidden">
      {!booted && <BootSequence onComplete={handleBootComplete} />}
      {/* Particle background */}
      <div className="fixed inset-0 z-0">
        <ParticleField />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(6,182,212,0.06)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.04)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.015)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(6,182,212,0.008)_2px,rgba(6,182,212,0.008)_4px)]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-cyan-500/15 bg-[#0a0e1a]/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="text-cyan-400/70 hover:bg-cyan-500/10 h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <img src={jarvisLogo} alt="JARVIS" className="h-8 w-8 rounded-full opacity-80" />
            <div>
              <h1 className="text-xs font-bold text-cyan-300 tracking-[0.3em] font-mono">J.A.R.V.I.S.</h1>
              <p className="text-[8px] text-cyan-500/40 font-mono tracking-widest">COMMAND & CONTROL INTERFACE v3.7</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-900/50 border border-cyan-500/10 rounded-lg px-3 py-1">
              <Shield className="h-3 w-3 text-cyan-500/50" />
              <span className="text-[10px] text-cyan-400/60 font-mono">{profile?.name || 'SUPER ADMIN'}</span>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-cyan-400/40 hover:text-red-400 hover:bg-red-500/10 h-8 w-8">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="relative z-10 flex lg:hidden border-b border-cyan-500/10 bg-[#0a0e1a]/80 backdrop-blur">
        {([
          { id: 'ai' as const, icon: MessageSquare, label: 'AI' },
          { id: 'hud' as const, icon: Camera, label: 'HUD' },
          { id: 'status' as const, icon: Activity, label: 'STATUS' },
          { id: 'commands' as const, icon: Terminal, label: 'LOG' },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setActivePanel(tab.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-mono tracking-wider transition-all ${activePanel === tab.id ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-cyan-500/30 hover:text-cyan-400/50'}`}>
            <tab.icon className="h-3 w-3" />{tab.label}
          </button>
        ))}
      </div>

      {/* Desktop layout */}
      <main className="relative z-10 h-[calc(100vh-49px)] lg:h-[calc(100vh-49px)]">
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-2 h-full p-2">

          {/* Left column - AI + Data */}
          <div className="col-span-3 flex flex-col gap-2 overflow-hidden">
            <HoloPanel title="AI Assistant" icon={<MessageSquare className="h-3 w-3" />} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-hidden -m-3">
                <AIAssistant onCommand={handleCommand} systemState={{ cameraActive, isScanning, suitMode, gestureEnabled }} />
              </div>
            </HoloPanel>
          </div>

          {/* Center column - JARVIS Ring + HUD */}
          <div className="col-span-6 flex flex-col gap-2">
            {/* JARVIS Core Display */}
            <div className="relative bg-slate-900/30 border border-cyan-500/10 rounded-lg overflow-hidden" style={{ height: '180px' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <JarvisRing size={160} />
              </div>
              {/* Floating labels */}
              <div className="absolute top-3 left-4 space-y-1">
                <div className="text-[9px] font-mono text-cyan-500/40 tracking-widest">SYSTEM STATUS</div>
                <div className="text-[11px] font-mono text-green-400/80">● ALL SYSTEMS NOMINAL</div>
              </div>
              <div className="absolute top-3 right-4 text-right space-y-1">
                <div className="text-[9px] font-mono text-cyan-500/40 tracking-widest">CLEARANCE</div>
                <div className="text-[11px] font-mono text-amber-400/80">LEVEL 5 — SUPER ADMIN</div>
              </div>
              <div className="absolute bottom-3 left-4">
                <div className="text-[9px] font-mono text-cyan-500/30">{liveTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div className="absolute bottom-3 right-4">
                <div className="text-lg font-mono text-cyan-400/60 tabular-nums">{liveTime.toLocaleTimeString()}</div>
              </div>
            </div>

            {/* Visual feed */}
            <div className="flex-1 min-h-0">
              <HoloPanel title="Visual Feed" icon={<Eye className="h-3 w-3" />} className="h-full flex flex-col">
                <div className="flex-1 -m-3 mt-0">
                  <HUDOverlay
                    isActive={cameraActive}
                    onToggle={() => { setCameraActive(!cameraActive); addCommand(cameraActive ? 'CAMERA OFF' : 'CAMERA ON', cameraActive ? 'Feed terminated' : 'Feed activated', 'system'); }}
                    isScanning={isScanning}
                    onScanToggle={() => { setIsScanning(!isScanning); addCommand(isScanning ? 'SCAN OFF' : 'SCAN ON', isScanning ? 'Disabled' : 'Engaged', 'system'); }}
                    suitMode={suitMode}
                    onSuitToggle={() => { setSuitMode(!suitMode); addCommand(suitMode ? 'SUIT OFF' : 'SUIT ON', suitMode ? 'Deactivated' : 'Activated', 'system'); }}
                    gestureEnabled={gestureEnabled}
                    onGestureToggle={() => { setGestureEnabled(!gestureEnabled); addCommand(gestureEnabled ? 'GESTURE OFF' : 'GESTURE ON', gestureEnabled ? 'Disabled' : 'Enabled', 'system'); }}
                    onGestureAction={handleGestureAction}
                  />
                </div>
              </HoloPanel>
            </div>
          </div>

          {/* Right column - Data + Log */}
          <div className="col-span-3 flex flex-col gap-2 overflow-hidden">
            <DataGrid />
            <HoloPanel title="System Status" icon={<Activity className="h-3 w-3" />} accentColor="green" className="flex-shrink-0">
              <SystemStatus />
            </HoloPanel>
            <HoloPanel title="Command Log" icon={<Terminal className="h-3 w-3" />} accentColor="purple" className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 overflow-hidden -m-3 mt-0">
                <CommandHistory commands={commands} />
              </div>
            </HoloPanel>
          </div>
        </div>

        {/* Mobile panels */}
        <div className="lg:hidden h-[calc(100vh-97px)]">
          {activePanel === 'ai' && <div className="h-full"><AIAssistant onCommand={handleCommand} systemState={{ cameraActive, isScanning, suitMode, gestureEnabled }} /></div>}
          {activePanel === 'hud' && (
            <div className="h-full p-2 flex flex-col gap-2">
              <div className="flex items-center justify-center py-3 bg-slate-900/30 border border-cyan-500/10 rounded-lg">
                <JarvisRing size={120} />
              </div>
              <div className="flex-1 min-h-0">
                <HUDOverlay isActive={cameraActive} onToggle={() => setCameraActive(!cameraActive)} isScanning={isScanning} onScanToggle={() => setIsScanning(!isScanning)} suitMode={suitMode} onSuitToggle={() => setSuitMode(!suitMode)} gestureEnabled={gestureEnabled} onGestureToggle={() => setGestureEnabled(!gestureEnabled)} onGestureAction={handleGestureAction} />
              </div>
            </div>
          )}
          {activePanel === 'status' && (
            <div className="h-full overflow-y-auto p-2 space-y-2">
              <DataGrid />
              <SystemStatus />
            </div>
          )}
          {activePanel === 'commands' && <div className="h-full"><CommandHistory commands={commands} /></div>}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
