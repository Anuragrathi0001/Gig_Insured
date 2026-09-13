"use client"

import createGlobe, { COBEOptions } from "cobe"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

const GLOBE_CONFIG: COBEOptions = {
  width: 1200,
  height: 1200,
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 1.2,
  mapSamples: 16000,
  mapBrightness: 3,
  baseColor: [0.82, 0.86, 0.82],
  markerColor: [249 / 255, 115 / 255, 22 / 255],
  glowColor: [0.92, 0.94, 0.92],
  markers: [], // No orange dots
}

export function Globe({
  className,
  config,
}: {
  className?: string
  config?: Partial<COBEOptions>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<number | null>(null)
  const phiRef = useRef(0)
  const rRef = useRef(0)

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab"
    }
  }

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current
      phiRef.current += delta * 0.005
      pointerInteracting.current = clientX
    }
  }

  useEffect(() => {
    if (!canvasRef.current) return

    let width = canvasRef.current.offsetWidth || 500
    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth || 500
      }
    }
    window.addEventListener("resize", onResize)

    const isDark = document.documentElement.classList.contains("dark")

    const mergedConfig: COBEOptions = {
      ...GLOBE_CONFIG,
      ...config,
      width: width * 2,
      height: width * 2,
      dark: 1, // Uniform black-ocean dot shader
      baseColor: [0.35, 0.36, 0.38],
      glowColor: [0.08, 0.09, 0.10],
      mapBrightness: 2.8,
      diffuse: 1.0,
      markers: [], // Zero orange dots
    }

    const globe = createGlobe(canvasRef.current, mergedConfig)

    // Continuous smooth spinning + scroll-driven physics loop
    let animId: number
    let smoothedScrollY = window.scrollY || 0

    const animate = () => {
      // Smooth lerp interpolation for scroll physics (inertial response)
      const targetScrollY = window.scrollY || 0
      smoothedScrollY += (targetScrollY - smoothedScrollY) * 0.08

      if (pointerInteracting.current === null) {
        phiRef.current += 0.0035 // continuous auto-rotation
      }

      // 1. Scroll-driven rotational inertia (accelerates rotation on scroll)
      const scrollRotation = smoothedScrollY * 0.0025

      // 2. Dynamic 3D axial tilt (pitches viewing angle as user scrolls down)
      const scrollTheta = 0.25 + Math.min(0.2, (smoothedScrollY / 1000) * 0.2)

      // 3. Subtle atmospheric scale expansion (zooms gently as user reaches bottom CTA)
      const scrollScale = 1 + Math.min(0.12, (smoothedScrollY / 1200) * 0.12)

      globe.update({
        phi: phiRef.current + scrollRotation,
        theta: scrollTheta,
        scale: scrollScale,
        width: width * 2,
        height: width * 2,
      })
      animId = requestAnimationFrame(animate)
    }
    animId = requestAnimationFrame(animate)

    // Dynamic theme observer: update globe when dark/light mode toggles
    const observer = new MutationObserver(() => {
      globe.update({
        dark: 1,
        baseColor: [0.35, 0.36, 0.38],
        glowColor: [0.08, 0.09, 0.10],
        mapBrightness: 2.8,
        diffuse: 1.0,
        markers: [],
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.style.opacity = "1"
      }
    }, 50)

    return () => {
      cancelAnimationFrame(animId)
      observer.disconnect()
      window.removeEventListener("resize", onResize)
      globe.destroy()
    }
  }, [])

  return (
    <div
      className={cn(
        "relative aspect-[1/1] w-full max-w-[800px] flex items-center justify-center",
        className,
      )}
    >
      <canvas
        className={cn(
          "size-full opacity-0 transition-opacity duration-700 [contain:layout_paint_size] dark:invert-0 dark:mix-blend-normal invert mix-blend-multiply",
        )}
        ref={canvasRef}
        onPointerDown={(e) => updatePointerInteraction(e.clientX)}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  )
}
