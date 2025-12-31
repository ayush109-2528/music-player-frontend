import { useRef, useEffect } from 'react'

export default function AuroraWaves({ analyser }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let time = 0
    let raf = null

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio
      canvas.height = window.innerHeight * window.devicePixelRatio
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
    }

    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      // Northern lights gradient background
      const gradientBg = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradientBg.addColorStop(0, '#0a0a1f')
      gradientBg.addColorStop(0.3, '#1a0a2e')
      gradientBg.addColorStop(0.7, '#2a0a3d')
      gradientBg.addColorStop(1, '#0f0f23')
      ctx.fillStyle = gradientBg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Audio-reactive bass (simulate if no analyser)
      let bass = 0.3
      if (analyser) {
        const data = new Uint8Array(64)
        // Mock audio data for demo
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.sin(time * 0.1 + i * 0.2) * 0.5 + 0.5) * 255
        }
        bass = data.slice(0, 12).reduce((a, b) => a + b, 0) / (12 * 255)
      }

      // 5 Aurora layers
      for (let layer = 0; layer < 5; layer++) {
        const speed = 0.3 + layer * 0.2
        const yOffset = (time * speed) % canvas.height
        
        // Aurora gradient for each layer
        const gradient = ctx.createLinearGradient(0, yOffset, canvas.width, yOffset + 200)
        
        // Dynamic aurora colors (green/purple/pink)
        const hue1 = 120 + layer * 15 + bass * 40  // Green-cyan
        const hue2 = 270 + layer * 20 + bass * 30  // Purple-blue  
        const hue3 = 320 + layer * 10 + bass * 50  // Pink-magenta
        
        gradient.addColorStop(0, `hsla(${hue1}, 60%, 25%, 0.1)`)
        gradient.addColorStop(0.2, `hsla(${hue1}, 70%, 35%, ${0.4 + bass * 0.4})`)
        gradient.addColorStop(0.5, `hsla(${hue2}, 75%, 45%, ${0.7 + bass * 0.3})`)
        gradient.addColorStop(0.8, `hsla(${hue3}, 70%, 40%, ${0.3 + bass * 0.4})`)
        gradient.addColorStop(1, `hsla(${hue3}, 60%, 25%, 0.05)`)

        ctx.fillStyle = gradient
        ctx.save()
        ctx.globalCompositeOperation = 'screen'  // Glow effect!
        
        ctx.beginPath()
        ctx.moveTo(0, yOffset + 80)

        // Smooth aurora waves
        for (let x = 0; x < canvas.width; x += 3) {
          const wave1 = Math.sin((x * 0.003 + time * 0.02 + layer) * 0.7) * 35
          const wave2 = Math.sin((x * 0.007 - time * 0.015 + layer * 2) * 1.3) * 20
          const wave3 = Math.sin((x * 0.012 + time * 0.01 + layer * 3) * 2.1) * 12
          const waveHeight = wave1 + wave2 * 0.6 + wave3 * 0.3 + bass * 60
          
          ctx.lineTo(x, yOffset + 80 + waveHeight)
        }
        
        ctx.lineTo(canvas.width, canvas.height + 100)
        ctx.lineTo(0, canvas.height + 100)
        ctx.closePath()
        ctx.fill()
        
        ctx.restore()
      }

      // Subtle stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      for (let i = 0; i < 50; i++) {
        const x = (time * 0.5 + i * 123.45) % canvas.width
        const y = (i * 67.89) % canvas.height
        const size = 1 + Math.sin(time * 0.1 + i) * 0.5
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      time += 1
      raf = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [analyser])

  return (
    <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none">
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  )
}
