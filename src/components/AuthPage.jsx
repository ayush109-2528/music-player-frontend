import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AuthPage({ 
  signInWithPassword, 
  signUp, 
  signInWithOtp, 
  verifyOtp, 
  resetPassword,
  onSuccess 
}) {
  
  // Auth modes
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const codeRefs = useRef([])

  // Sign in with email/password
  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    
    setLoading(true)
    setError('')
    
    const { error } = await signInWithPassword(email, password)
    setLoading(false)
    
    if (error) {
      setError(error.message)
    } else {
      onSuccess()
    }
  }

  // Sign up
  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!email || !password || password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    setError('')
    
    const { error } = await signUp(email, password)
    setLoading(false)
    
    if (error) {
      setError(error.message)
    } else {
      setMode('verify')
    }
  }

  // Send OTP
  const sendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signInWithOtp(email)
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setMode('verify')
    }
  }

  // Verify OTP
  const verifyCode = async () => {
    const token = code.join('')
    if (token.length !== 6) return

    setLoading(true)
    setError('')

    const { error } = await verifyOtp(email, token)
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      onSuccess()
    }
  }

  // Forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await resetPassword(email)
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setError('Password reset email sent! Check your inbox.')
    }
  }

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus()
    }

    if (index === 5 && value.length === 1) {
      verifyCode()
    }
  }

  const handleBackspace = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  const goBack = () => {
    setCode(['', '', '', '', '', ''])
    setError('')
    setMode('signin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Mode tabs */}
        <div className="flex bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-1 mb-8">
          <motion.button
            onClick={() => setMode('signin')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              mode === 'signin' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                : 'text-white/70 hover:text-white'
            }`}
            whileHover={{ scale: mode === 'signin' ? 1.02 : 1 }}
          >
            Sign In
          </motion.button>
          <motion.button
            onClick={() => setMode('signup')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              mode === 'signup' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                : 'text-white/70 hover:text-white'
            }`}
            whileHover={{ scale: mode === 'signup' ? 1.02 : 1 }}
          >
            Sign Up
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'signin' && (
            <motion.div
              key="signin"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="space-y-6 bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10"
            >
              <h1 className="text-3xl font-bold text-white text-center mb-2">
                Welcome back
              </h1>
              <p className="text-white/60 text-center mb-8">Sign in to your account</p>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-all text-lg"
                    required
                  />
                </div>
                
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-all text-lg"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="w-full text-sm text-purple-400 hover:text-purple-300 transition-colors text-left"
                >
                  Forgot password?
                </button>

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full py-4 px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <button
                onClick={sendOtp}
                disabled={loading || !email}
                className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white transition-all flex items-center justify-center gap-2 text-sm"
              >
                Or continue with magic link
              </button>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-300 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}
            </motion.div>
          )}

          {mode === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6 bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10"
            >
              <h1 className="text-3xl font-bold text-white text-center mb-2">
                Create account
              </h1>
              <p className="text-white/60 text-center mb-8">Join SoundSpace today</p>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-all text-lg"
                    required
                  />
                </div>
                
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-all text-lg"
                    required
                  />
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-all text-lg"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !password || password !== confirmPassword}
                  className="w-full py-4 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-300 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}
            </motion.div>
          )}

          {mode === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 text-center"
            >
              <h1 className="text-3xl font-bold text-white mb-2">Check your email</h1>
              <p className="text-white/70 mb-8">
                We've sent a {mode === 'signup' ? 'confirmation' : 'magic link'} code to<br/>
                <span className="font-semibold text-purple-400">{email}</span>
              </p>

              <div className="flex gap-3 justify-center mb-8">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { codeRefs.current[i] = el }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleBackspace(i, e)}
                    disabled={loading}
                    className="w-16 h-16 text-2xl font-bold text-center bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl focus:border-purple-400 focus:outline-none transition-all"
                  />
                ))}
              </div>

              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={goBack}
                  className="flex-1 py-4 px-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-all text-white text-sm"
                >
                  Back
                </button>
                <button
                  onClick={verifyCode}
                  disabled={loading || code.some(c => !c)}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Continue'}
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'forgot' && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10"
            >
              <h1 className="text-3xl font-bold text-white text-center mb-2">
                Reset Password
              </h1>
              <p className="text-white/60 text-center mb-8">
                Enter your email and we'll send you a link to reset your password
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-all text-lg"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-4 px-8 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              {error && !error.includes('sent') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-300 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              <button
                onClick={() => setMode('signin')}
                className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white transition-all text-sm"
              >
                Back to Sign In
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}