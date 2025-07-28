"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Behaviour overview
 * ──────────────────────────────────────────────
 * Desktop
 *   • Left‑click → toggles theme
 *   • Right‑click → opens dropdown
 *
 * Mobile / touch
 *   • Tap (< LONG_PRESS_MS) → toggles theme
 *   • Long‑press (≥ LONG_PRESS_MS) → opens dropdown (on release)
 *
 * Rationale
 *   Using press‑duration on `pointerup` avoids timing race conditions (where
 *   `pointerup` fires before our timer). This yields rock‑solid behaviour on
 *   iOS/Safari and Android alike.
 */
export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light")
  }, [theme, setTheme])

  // ──────────────────────────────────────────────
  // Press tracking (touch only)
  // ──────────────────────────────────────────────
  const LONG_PRESS_MS = 500
  const MOVE_THRESHOLD_PX = 12 // forgiving drift

  const startTime = React.useRef(0)
  const startXY = React.useRef({ x: 0, y: 0 })
  const movedTooMuch = React.useRef(false)

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.pointerType === "touch") {
      startTime.current = performance.now()
      startXY.current = { x: e.clientX, y: e.clientY }
      movedTooMuch.current = false
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "touch" || movedTooMuch.current) return
    const dx = e.clientX - startXY.current.x
    const dy = e.clientY - startXY.current.y
    if (dx * dx + dy * dy > MOVE_THRESHOLD_PX * MOVE_THRESHOLD_PX) {
      movedTooMuch.current = true
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation()

    if (e.pointerType === "mouse" && e.button === 0) {
      // Desktop left‑click
      toggleTheme()
      return
    }

    if (e.pointerType === "touch" && !movedTooMuch.current) {
      const duration = performance.now() - startTime.current
      if (duration >= LONG_PRESS_MS) {
        setIsDropdownOpen(true)
      } else {
        toggleTheme()
      }
    }
  }

  const handlePointerCancel = () => {
    movedTooMuch.current = false
  }

  const handleContextMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDropdownOpen(true)
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            className="relative"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onContextMenu={handleContextMenu}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="font-mono">
          {(["light", "dark", "system"] as const).map((mode) => (
            <DropdownMenuItem
              key={mode}
              onClick={(e) => {
                e.stopPropagation()
                setTheme(mode)
                setIsDropdownOpen(false)
              }}
              className="text-xs uppercase"
            >
              {mode}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
