import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayer } from '../contexts/PlayerContext'
import { SkipBack, Play, Pause, SkipForward, Volume2, VolumeX, Maximize2, Minimize2, ChevronDown, Check, Eye } from 'lucide-react'

// ==========================================
// 1. ORB VISUALIZER (Raw WebGL)
// ==========================================
const OrbVisualizer = ({ analyser }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return

    const vsSource = `
      precision mediump float;
      attribute vec2 a_position;
      varying vec2 vUv;
      void main() {
        vUv = .5 * (a_position + 1.);
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    const fsSource = `
      precision highp float;
      varying vec2 vUv;
      uniform float iTime;
      uniform vec3 iResolution;
      uniform float hue;
      uniform float hover;
      uniform float rot;
      uniform float hoverIntensity;

      vec3 rgb2yiq(vec3 c) { return vec3(dot(c, vec3(0.299, 0.587, 0.114)), dot(c, vec3(0.596, -0.274, -0.322)), dot(c, vec3(0.211, -0.523, 0.312))); }
      vec3 yiq2rgb(vec3 c) { return vec3(c.x + 0.956 * c.y + 0.621 * c.z, c.x - 0.272 * c.y - 0.647 * c.z, c.x - 1.106 * c.y + 1.703 * c.z); }
      vec3 adjustHue(vec3 color, float hueDeg) {
        float hueRad = hueDeg * 3.14159265 / 180.0;
        vec3 yiq = rgb2yiq(color);
        float cosA = cos(hueRad); float sinA = sin(hueRad);
        float i = yiq.y * cosA - yiq.z * sinA;
        float q = yiq.y * sinA + yiq.z * cosA;
        yiq.y = i; yiq.z = q;
        return yiq2rgb(yiq);
      }
      vec3 hash33(vec3 p3) {
        p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
        p3 += dot(p3, p3.yxz + 19.19);
        return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
      }
      float snoise3(vec3 p) {
        const float K1 = 0.333333333; const float K2 = 0.166666667;
        vec3 i = floor(p + (p.x + p.y + p.z) * K1);
        vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
        vec3 e = step(vec3(0.0), d0 - d0.yzx);
        vec3 i1 = e * (1.0 - e.zxy);
        vec3 i2 = 1.0 - e.zxy * (1.0 - e);
        vec3 d1 = d0 - (i1 - K2); vec3 d2 = d0 - (i2 - K1); vec3 d3 = d0 - 0.5;
        vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
        vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
        return dot(vec4(31.316), n);
      }
      float light1(float intensity, float attenuation, float dist) { return intensity / (1.0 + dist * attenuation); }
      float light2(float intensity, float attenuation, float dist) { return intensity / (1.0 + dist * dist * attenuation); }

      const vec3 baseColor1 = vec3(0.61, 0.26, 0.99); 
      const vec3 baseColor2 = vec3(0.29, 0.76, 0.91); 
      const vec3 baseColor3 = vec3(0.06, 0.07, 0.60); 
      const float innerRadius = 0.6;
      const float noiseScale = 0.65;

      void main() {
        vec2 center = iResolution.xy * 0.5;
        float size = min(iResolution.x, iResolution.y);
        vec2 uv = (gl_FragCoord.xy - center) / size * 2.0;
        
        float s = sin(rot); float c = cos(rot);
        uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
        uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
        uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);

        vec3 color1 = adjustHue(baseColor1, hue);
        vec3 color2 = adjustHue(baseColor2, hue);
        vec3 color3 = adjustHue(baseColor3, hue);
        float ang = atan(uv.y, uv.x);
        float len = length(uv);
        float invLen = len > 0.0 ? 1.0 / len : 0.0;
        
        float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
        float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
        float d0 = distance(uv, (r0 * invLen) * uv);
        
        float v0 = light1(1.0, 10.0, d0);
        v0 *= smoothstep(r0 * 1.05, r0, len);
        
        float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;
        float a = iTime * -1.0;
        vec2 pos = vec2(cos(a), sin(a)) * r0;
        float d = distance(uv, pos);
        float v1 = light2(1.5, 5.0, d);
        v1 *= light1(1.0, 50.0, d0);
        
        float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
        float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);
        
        vec3 col = mix(color1, color2, cl);
        col = mix(color3, col, v0);
        col = (col + v1) * v2 * v3;
        col = clamp(col, 0.0, 1.0);
        
        gl_FragColor = vec4(col, 1.0);
      }
    `

    const createShader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    const program = gl.createProgram(); 
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, vsSource)); 
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fsSource)); 
    gl.linkProgram(program); gl.useProgram(program);

    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_position'); gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'iTime');
    const uRes = gl.getUniformLocation(program, 'iResolution');
    const uHover = gl.getUniformLocation(program, 'hover');
    const uHoverInt = gl.getUniformLocation(program, 'hoverIntensity');
    const uRot = gl.getUniformLocation(program, 'rot');
    const uHue = gl.getUniformLocation(program, 'hue');

    const resize = () => { 
      canvas.width = window.innerWidth; 
      canvas.height = window.innerHeight; 
      gl.viewport(0, 0, canvas.width, canvas.height); 
      gl.uniform3f(uRes, canvas.width, canvas.height, 1.0);
    }
    window.addEventListener('resize', resize); resize();

    let rot = 0;
    let currentLevel = 0;

    const render = () => {
      let level = 0;
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for(let i=0; i<data.length; i++) { sum += (data[i] / 255.0) * (data[i] / 255.0); }
        level = Math.sqrt(sum / data.length) * 2.5; 
        level = Math.min(level, 1.0);
      }
      
      currentLevel += (level - currentLevel) * 0.1;
      rot += 0.005 + (currentLevel * 0.02);

      gl.uniform1f(uTime, performance.now() * 0.001);
      gl.uniform1f(uHover, currentLevel); 
      gl.uniform1f(uHoverInt, currentLevel * 1.5);
      gl.uniform1f(uRot, rot);
      gl.uniform1f(uHue, 0.0);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationRef.current = requestAnimationFrame(render);
    }
    render();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationRef.current); }
  }, [analyser])

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
}

// ==========================================
// 2. NEURAL VORTEX VISUALIZER
// ==========================================
const NeuralVortex = ({ analyser }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return

    const vsSource = `precision mediump float; attribute vec2 a_position; varying vec2 vUv; void main() { vUv = .5 * (a_position + 1.); gl_Position = vec4(a_position, 0.0, 1.0); }`
    const fsSource = `
      precision mediump float; varying vec2 vUv; uniform float u_time; uniform float u_ratio; uniform float u_bass; 
      vec2 rotate(vec2 uv, float th) { return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv; }
      float neuro_shape(vec2 uv, float t, float p) {
        vec2 sine_acc = vec2(0.); vec2 res = vec2(0.); float scale = 8.;
        for (int j = 0; j < 15; j++) {
          uv = rotate(uv, 1.); sine_acc = rotate(sine_acc, 1.);
          vec2 layer = uv * scale + float(j) + sine_acc - t;
          sine_acc += sin(layer) + 3.5 * p; 
          res += (.5 + .5 * cos(layer)) / scale; scale *= (1.2);
        }
        return res.x + res.y;
      }
      void main() {
        vec2 uv = .5 * vUv; uv.x *= u_ratio;
        float p = smoothstep(0.1, 0.9, u_bass); 
        float t = .001 * u_time;
        float noise = neuro_shape(uv, t, p);
        noise = 1.2 * pow(noise, 3.); noise += pow(noise, 10.);
        noise = max(.0, noise - (0.5 - p * 0.1)); noise *= (1. - length(vUv - .5));
        vec3 color = mix(vec3(0.5, 0.15, 0.65), vec3(0.02, 0.7, 0.9), p);
        color = mix(color, vec3(1.0, 0.0, 0.5), pow(p, 3.0));
        gl_FragColor = vec4(color * noise, 1.0);
      }
    `
    const createShader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    const program = gl.createProgram(); gl.attachShader(program, createShader(gl.VERTEX_SHADER, vsSource)); gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fsSource)); gl.linkProgram(program); gl.useProgram(program);

    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_position'); gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time'); const uRatio = gl.getUniformLocation(program, 'u_ratio'); const uBass = gl.getUniformLocation(program, 'u_bass');
    
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform1f(uRatio, canvas.width / canvas.height); }
    window.addEventListener('resize', resize); resize();

    let currentBass = 0;
    const render = () => {
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(data);
        let sum = 0; for(let i=0; i<8; i++) sum += data[i]; 
        let target = (sum / 8 / 255) * 1.8; target = Math.min(target, 1.0);
        currentBass += (target - currentBass) * 0.4;
      }
      gl.uniform1f(uTime, performance.now()); gl.uniform1f(uBass, currentBass); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationRef.current = requestAnimationFrame(render);
    }
    render();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationRef.current); }
  }, [analyser])

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
}

// ==========================================
// 3. NEON RINGS VISUALIZER
// ==========================================
const NeonRings = ({ analyser }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize); resize();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = 220; 
        const bars = 120;
        const step = Math.floor(bufferLength / bars);

        for (let i = 0; i < bars; i++) {
          const val = dataArray[i * step];
          const barHeight = (val / 255) * 200;
          const rad = (Math.PI * 2) * (i / bars);
          const x1 = cx + Math.cos(rad) * radius;
          const y1 = cy + Math.sin(rad) * radius;
          const x2 = cx + Math.cos(rad) * (radius + barHeight);
          const y2 = cy + Math.sin(rad) * (radius + barHeight);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
          gradient.addColorStop(0, '#a855f7');
          gradient.addColorStop(1, '#ec4899');
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }
      animationRef.current = requestAnimationFrame(render);
    }
    render();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationRef.current); }
  }, [analyser])

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-80" />
}

// ==========================================
// 4. MATRIX RAIN VISUALIZER
// ==========================================
const MatrixRain = ({ analyser }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const dropsRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const resize = () => { 
        canvas.width = window.innerWidth; 
        canvas.height = window.innerHeight; 
        const columns = Math.floor(canvas.width / 20);
        dropsRef.current = new Array(columns).fill(1);
    }
    window.addEventListener('resize', resize); resize();

    const render = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      let bassBoost = 1;
      if (analyser) {
          const data = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(data);
          let sum = 0; for(let i=0; i<5; i++) sum += data[i];
          bassBoost = 1 + (sum / 5 / 255) * 5; 
      }

      ctx.font = '15px monospace';

      for (let i = 0; i < dropsRef.current.length; i++) {
        const text = String.fromCharCode(0x30A0 + Math.random() * 96);
        const hue = (bassBoost * 50) % 360; 
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillText(text, i * 20, dropsRef.current[i] * 20);
        if (dropsRef.current[i] * 20 > canvas.height && Math.random() > 0.975) {
          dropsRef.current[i] = 0;
        }
        dropsRef.current[i] += (0.5 * bassBoost); 
      }
      animationRef.current = requestAnimationFrame(render);
    }
    render();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationRef.current); }
  }, [analyser])

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />
}

// ==========================================
// MAIN CONTROLS COMPONENT
// ==========================================
export default function PlayerControls() {
  const { state, actions } = usePlayer()
  const { currentTrack, isPlaying, volume, muted } = state
  
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [visualizerMode, setVisualizerMode] = useState('orb')
  const [showVisMenu, setShowVisMenu] = useState(false)
  
  const audioRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)

  const initAudio = () => {
    if (!audioRef.current || audioContextRef.current) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    } catch(e) { console.warn("Audio Context Error", e); }
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();

    const handlePlay = async () => {
      if (isPlaying) {
        await audio.play();
        initAudio();
      } else {
        audio.pause();
      }
    };

    if (audio.src !== currentTrack.url) {
      audio.src = currentTrack.url;
      audio.load();
    }
    handlePlay();
  }, [currentTrack, isPlaying]);

  useEffect(() => {
      if(audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const onTimeUpdate = () => setCurrentTime(audioRef.current.currentTime);
  const onLoadedMetadata = () => setDuration(audioRef.current.duration);
  const onEnded = () => actions.nextTrack();
  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };
  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      <motion.div 
        layout
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`fixed left-0 right-0 border-t border-white/10 shadow-2xl overflow-hidden transition-all duration-500
            ${isExpanded 
                ? 'top-0 h-screen bg-black z-[9999] flex flex-col'
                : 'bottom-0 h-24 bg-black/90 backdrop-blur-xl z-[50]'
            }`}
      >
        <audio ref={audioRef} crossOrigin="anonymous" onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMetadata} onEnded={onEnded} />

        {/* --- ACTIVE VISUALIZER --- */}
        {isExpanded && (
           <>
             {visualizerMode === 'orb' && <OrbVisualizer analyser={analyserRef.current} />}
             {visualizerMode === 'neural' && <NeuralVortex analyser={analyserRef.current} />}
             {visualizerMode === 'bars' && <NeonRings analyser={analyserRef.current} />}
             {visualizerMode === 'matrix' && <MatrixRain analyser={analyserRef.current} />}
           </>
        )}

        {/* --- TOP VISUALIZER MENU --- */}
        {isExpanded && (
            <div className="absolute top-8 left-8 z-50">
                <button 
                    onClick={() => setShowVisMenu(!showVisMenu)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium transition"
                >
                    <Eye size={16} /> 
                    <span className="capitalize">{visualizerMode}</span>
                    <ChevronDown size={14} className={`transition-transform ${showVisMenu ? 'rotate-180' : ''}`} />
                </button>

                {showVisMenu && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1">
                        {[
                            { id: 'orb', name: 'Magic Orb' },
                            { id: 'neural', name: 'Neural Vortex' },
                            { id: 'bars', name: 'Neon Rings' },
                            { id: 'matrix', name: 'Matrix Rain' }
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => { setVisualizerMode(mode.id); setShowVisMenu(false); }}
                                className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-between"
                            >
                                {mode.name}
                                {visualizerMode === mode.id && <Check size={14} className="text-purple-400" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* --- MINIMIZE BUTTON --- */}
        {isExpanded && (
            <button 
                onClick={() => setIsExpanded(false)} 
                className="absolute top-8 right-8 z-50 p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition backdrop-blur-md"
            >
                <Minimize2 size={24} />
            </button>
        )}

        {/* --- MAIN UI --- */}
        <div className={`relative z-10 w-full h-full flex ${isExpanded ? 'flex-col items-center justify-center' : 'max-w-7xl mx-auto px-6 flex-row items-center justify-between'}`}>

            {/* ARTWORK */}
            <div className={`transition-all duration-500 ${isExpanded ? 'flex flex-col items-center gap-8 mb-10' : 'flex items-center gap-4 w-1/3'}`}>
                <div className={`relative rounded-xl overflow-hidden transition-all ${
                    isExpanded ? 'w-80 h-80 shadow-2xl border border-white/10' : 'w-14 h-14 border-0'
                }`}>
                    <img src={currentTrack.artwork || '/default_cover.jpg'} className="w-full h-full object-cover" />
                </div>
                <div className={`${isExpanded ? 'text-center' : 'min-w-0'}`}>
                    <h3 className={`font-bold text-white truncate ${isExpanded ? 'text-4xl mb-2' : 'text-base'}`}>{currentTrack.title}</h3>
                    <p className={`text-zinc-400 truncate ${isExpanded ? 'text-xl font-medium' : 'text-xs'}`}>{currentTrack.artist}</p>
                </div>
            </div>

            {/* PROGRESS (Expanded) */}
            {isExpanded && (
                <div className="w-full max-w-2xl space-y-3 mb-10 px-6 backdrop-blur-sm bg-black/20 p-4 rounded-2xl border border-white/5">
                    <input 
                        type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-300 font-mono font-medium">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            )}

            {/* CONTROLS */}
            <div className={`flex items-center gap-6 ${isExpanded ? 'scale-150 gap-10' : ''}`}>
                <button onClick={actions.previousTrack} className="text-zinc-400 hover:text-white transition"><SkipBack size={26} /></button>
                <button onClick={actions.togglePlay} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg">
                    {isPlaying ? <Pause fill="currentColor" size={20} /> : <Play fill="currentColor" className="ml-1" size={20} />}
                </button>
                <button onClick={actions.nextTrack} className="text-zinc-400 hover:text-white transition"><SkipForward size={26} /></button>
            </div>

            {/* UTILS - MOVED TO BOTTOM RIGHT */}
            <div className={`flex items-center gap-4 ${isExpanded ? 'absolute bottom-8 right-8 z-50' : 'justify-end w-1/3'}`}>
                <div className="group flex items-center bg-white/5 rounded-full p-2 pr-4 transition-all hover:bg-white/10 backdrop-blur-md border border-white/5">
                    <button onClick={actions.toggleMute} className="p-1 mr-2 text-zinc-400 group-hover:text-white">
                        {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => actions.setVolume(parseFloat(e.target.value))} className="w-20 h-1 bg-zinc-600 rounded-lg accent-white cursor-pointer" />
                </div>
                {!isExpanded && (
                    <button onClick={() => setIsExpanded(true)} className="p-2 text-zinc-400 hover:text-white"><Maximize2 size={20} /></button>
                )}
            </div>

        </div>
      </motion.div>
    </AnimatePresence>
  )
}