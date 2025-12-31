import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Eye, EyeOff, Sparkles, Wand2 } from "lucide-react"; // Added Wand2 for Magic Link

// --- UI COMPONENTS ---

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-purple-600 text-white hover:bg-purple-700",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-zinc-700 bg-transparent hover:bg-zinc-800 text-white",
    secondary: "bg-zinc-800 text-white hover:bg-zinc-700",
    ghost: "hover:bg-zinc-800 hover:text-white",
    link: "text-purple-400 underline-offset-4 hover:underline",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };
  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
});
Button.displayName = "Button";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-300 ${className}`}
    {...props}
  />
));
Label.displayName = "Label";

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    className={`h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500 ${className}`}
    {...props}
  />
));
Checkbox.displayName = "Checkbox";

// --- ANIMATION COMPONENTS ---

const Pupil = ({ size = 12, maxDistance = 5, pupilColor = "black", forceLookX, forceLookY }) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const pupilRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }
    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;
    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  };

  const pos = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
};

const EyeBall = ({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = "white", pupilColor = "black", isBlinking = false, forceLookX, forceLookY }) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const eyeRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }
    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;
    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  };

  const pos = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
};

// --- MAIN AUTH PAGE ---

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Success Message

  // Animation States
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  
  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Blinking Logic
  useEffect(() => {
    const blink = (setBlink) => {
      const timeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          blink(setBlink);
        }, 150);
      }, Math.random() * 4000 + 3000);
      return timeout;
    };
    const t1 = blink(setIsPurpleBlinking);
    const t2 = blink(setIsBlackBlinking);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Typing Logic
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  // Peeking Logic
  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const peek = setTimeout(() => {
        setIsPurplePeeking(true);
        setTimeout(() => setIsPurplePeeking(false), 800);
      }, Math.random() * 3000 + 2000);
      return () => clearTimeout(peek);
    } else {
      setIsPurplePeeking(false);
    }
  }, [password, showPassword]);

  const calculatePosition = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    return {
      faceX: Math.max(-15, Math.min(15, deltaX / 20)),
      faceY: Math.max(-10, Math.min(10, deltaY / 30)),
      bodySkew: Math.max(-6, Math.min(6, -deltaX / 120))
    };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  // --- AUTH HANDLERS ---

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Artificial Delay for Animation Feel (1.5s)
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Check your email for the confirmation link!");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Artificial Delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setSuccess("✨ Magic link sent! Check your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email to reset your password.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Artificial Delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSuccess("Password reset link sent to your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-black text-white">
      
      {/* LEFT SIDE: ANIMATED CHARACTERS */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-purple-900/40 via-black to-purple-900/20 p-12 overflow-hidden">
        
        {/* Brand */}
        <div className="relative z-20 flex items-center gap-2 text-lg font-semibold text-purple-400">
            <div className="size-8 rounded-lg bg-purple-500/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <span>Sound Space</span>
        </div>

        {/* Characters Container */}
        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <div className="relative" style={{ width: '550px', height: '400px' }}>
            
            {/* 1. Purple Character (Back) */}
            <div 
              ref={purpleRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '70px', width: '180px', height: (isTyping || (password.length > 0 && !showPassword)) ? '440px' : '400px',
                backgroundColor: '#6C3FF5', borderRadius: '10px 10px 0 0', zIndex: 1,
                transform: `skewX(${purplePos.bodySkew}deg) translateX(${isTyping ? 40 : 0}px)`, transformOrigin: 'bottom center'
              }}
            >
              <div className="absolute flex gap-8 transition-all duration-700 ease-in-out" 
                   style={{ left: isLookingAtEachOther ? '55px' : `${45 + purplePos.faceX}px`, top: `${40 + purplePos.faceY}px` }}>
                <EyeBall size={18} pupilSize={7} maxDistance={5} isBlinking={isPurpleBlinking} 
                         forceLookX={isLookingAtEachOther ? 3 : undefined} forceLookY={isLookingAtEachOther ? 4 : undefined} />
                <EyeBall size={18} pupilSize={7} maxDistance={5} isBlinking={isPurpleBlinking}
                         forceLookX={isLookingAtEachOther ? 3 : undefined} forceLookY={isLookingAtEachOther ? 4 : undefined} />
              </div>
            </div>

            {/* 2. Black Character (Middle) */}
            <div 
              ref={blackRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '240px', width: '120px', height: '310px', backgroundColor: '#2D2D2D', borderRadius: '8px 8px 0 0', zIndex: 2,
                transform: `skewX(${blackPos.bodySkew}deg) translateX(${isLookingAtEachOther ? 20 : 0}px)`, transformOrigin: 'bottom center'
              }}
            >
              <div className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                   style={{ left: isLookingAtEachOther ? '32px' : `${26 + blackPos.faceX}px`, top: `${32 + blackPos.faceY}px` }}>
                <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={isBlackBlinking}
                         forceLookX={isLookingAtEachOther ? 0 : undefined} forceLookY={isLookingAtEachOther ? -4 : undefined} />
                <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={isBlackBlinking}
                         forceLookX={isLookingAtEachOther ? 0 : undefined} forceLookY={isLookingAtEachOther ? -4 : undefined} />
              </div>
            </div>

            {/* 3. Orange Character (Front Left) */}
            <div 
              ref={orangeRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '0px', width: '240px', height: '200px', backgroundColor: '#FF9B6B', borderRadius: '120px 120px 0 0', zIndex: 3,
                transform: `skewX(${orangePos.bodySkew}deg)`, transformOrigin: 'bottom center'
              }}
            >
              <div className="absolute flex gap-8 transition-all duration-200 ease-out"
                   style={{ left: `${82 + orangePos.faceX}px`, top: `${90 + orangePos.faceY}px` }}>
                <Pupil size={12} pupilColor="#2D2D2D" />
                <Pupil size={12} pupilColor="#2D2D2D" />
              </div>
            </div>

            {/* 4. Yellow Character (Front Right) */}
            <div 
              ref={yellowRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '310px', width: '140px', height: '230px', backgroundColor: '#E8D754', borderRadius: '70px 70px 0 0', zIndex: 4,
                transform: `skewX(${yellowPos.bodySkew}deg)`, transformOrigin: 'bottom center'
              }}
            >
              <div className="absolute flex gap-6 transition-all duration-200 ease-out"
                   style={{ left: `${52 + yellowPos.faceX}px`, top: `${40 + yellowPos.faceY}px` }}>
                <Pupil size={12} pupilColor="#2D2D2D" />
                <Pupil size={12} pupilColor="#2D2D2D" />
              </div>
              <div className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
                   style={{ left: `${40 + yellowPos.faceX}px`, top: `${88 + yellowPos.faceY}px` }} />
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="flex items-center justify-center p-8 bg-black">
        <div className="w-full max-w-[420px] space-y-6">
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">
              {isLogin ? "Welcome back!" : "Create an account"}
            </h1>
            <p className="text-zinc-400 text-sm">
              {isLogin ? "Please enter your details." : "Join us to start uploading."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-purple-400 hover:text-purple-300 hover:underline"
                >
                    Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-green-400 bg-green-950/20 border border-green-900/30 rounded-lg">
                {success}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : isLogin ? "Log in" : "Sign Up"}
            </Button>
          </form>

          {/* MAGIC LINK BUTTON (Replaces Google) */}
          <div className="mt-6">
            <Button 
                variant="outline" 
                className="w-full border-zinc-700 hover:bg-zinc-900 hover:border-purple-500 transition-all group" 
                type="button"
                onClick={handleMagicLink}
                disabled={loading}
            >
              <Wand2 className="mr-2 size-4 text-purple-400 group-hover:text-purple-300" />
              Sign in with Magic Link
            </Button>
          </div>

          <div className="text-center text-sm text-zinc-400 mt-8">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(null); setSuccess(null); }} 
                className="text-purple-400 hover:text-purple-300 font-medium hover:underline"
            >
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}