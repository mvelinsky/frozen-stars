<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { createUnits } from '../engine/units'

const props = defineProps<{
  solarMass: number
  nFaller: number
  nObserver: number
  nCurrentFaller: number
}>()

const units = computed(() => createUnits(props.solarMass))

// Schwarzschild radius in pixels (scale factor for visualization)
const RS_PIXELS = 40  // Horizon radius in pixels

// Canvas dimensions
const canvasWidth = 2000
const canvasHeight = 300

// Canvas ref
const blackHoleCanvas = ref<HTMLCanvasElement | null>(null)

// Zoom state
const zoom = ref<number>(1)

function zoomIn() {
  zoom.value *= 1.5
}

function zoomOut() {
  zoom.value /= 1.5
}

function resetZoom() {
  zoom.value = 1
}

// Draw the black hole as an arc on canvas
function drawBlackHole() {
  const canvas = blackHoleCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const radius = RS_PIXELS * zoom.value
  const centerY = canvas.height / 2
  const centerX = horizonEdgeX - radius  // Center moves left as zoom increases

  // Calculate angles for visible arc based on canvas viewport
  // For the right semicircle (angles from -PI/2 to PI/2):
  // cos(angle) = (x - cx) / r

  // Find the top and bottom angles based on viewport constraints
  // The left edge (x=0) and right edge (x=canvasWidth) constrain what's visible
  let startAngle = Math.PI / 2  // Top of semicircle (default)
  let endAngle = -Math.PI / 2   // Bottom of semicircle (default)

  // Left edge constraint
  const cosAtLeft = (0 - centerX) / radius
  if (cosAtLeft > -1 && cosAtLeft < 1) {
    // Left edge cuts through the circle - constrain top angle
    startAngle = Math.min(startAngle, Math.acos(cosAtLeft))
    endAngle = Math.max(endAngle, -Math.acos(cosAtLeft))
  }

  // Right edge constraint
  const cosAtRight = (canvas.width - centerX) / radius
  if (cosAtRight > -1 && cosAtRight < 1) {
    // Right edge cuts through the circle - constrain to smaller arc
    startAngle = Math.min(startAngle, Math.acos(cosAtRight))
    endAngle = Math.max(endAngle, -Math.acos(cosAtRight))
  }

  // Draw filled arc (black hole interior)
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  // Start at the top point
  ctx.moveTo(centerX + radius * Math.cos(startAngle), centerY + radius * Math.sin(startAngle))
  // Arc clockwise to the bottom point
  ctx.arc(centerX, centerY, radius, startAngle, endAngle, true)
  ctx.closePath()
  ctx.fill()

  // Draw border
  ctx.strokeStyle = 'rgba(107, 114, 128, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, startAngle, endAngle, true)
  ctx.stroke()

  // Draw accretion disk (glowing ring around the black hole)
  const diskInnerRadius = radius * 1.5
  const diskOuterRadius = radius * 3.5

  // Only render if within screen bounds
  if (diskOuterRadius < canvas.width * 2) {
    // Create gradient for the disk (brighter near inner edge, fading out)
    const diskGradient = ctx.createRadialGradient(
      centerX, centerY, diskInnerRadius,
      centerX, centerY, diskOuterRadius
    )
    diskGradient.addColorStop(0, 'rgba(255, 200, 100, 0.8)')   // Bright hot inner edge
    diskGradient.addColorStop(0.2, 'rgba(255, 150, 50, 0.6)')   // Orange
    diskGradient.addColorStop(0.5, 'rgba(200, 100, 50, 0.3)')  // Red-orange
    diskGradient.addColorStop(1, 'rgba(150, 50, 50, 0)')        // Fade to transparent

    // Draw as a full circle ring
    ctx.fillStyle = diskGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, diskOuterRadius, 0, Math.PI * 2, false)
    ctx.arc(centerX, centerY, diskInnerRadius, Math.PI * 2, 0, true)
    ctx.closePath()
    ctx.fill()

    // Add brighter inner rim glow (full circle)
    const rimGradient = ctx.createRadialGradient(
      centerX, centerY, diskInnerRadius * 0.9,
      centerX, centerY, diskInnerRadius * 1.2
    )
    rimGradient.addColorStop(0, 'rgba(255, 255, 200, 0)')
    rimGradient.addColorStop(0.5, 'rgba(255, 220, 150, 0.6)')
    rimGradient.addColorStop(1, 'rgba(255, 200, 100, 0)')

    ctx.fillStyle = rimGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, diskInnerRadius * 1.2, 0, Math.PI * 2, false)
    ctx.arc(centerX, centerY, diskInnerRadius * 0.9, Math.PI * 2, 0, true)
    ctx.closePath()
    ctx.fill()
  }

  // Draw the left semicircle if the center is visible (zoomed out)
  if (centerX >= 0) {
    // Draw filled left semicircle (angles from PI/2 through PI to 3*PI/2)
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.moveTo(centerX + radius * Math.cos(Math.PI / 2), centerY + radius * Math.sin(Math.PI / 2))
    ctx.arc(centerX, centerY, radius, Math.PI / 2, 3 * Math.PI / 2, false)
    ctx.closePath()
    ctx.fill()

    // Draw border for left semicircle
    ctx.strokeStyle = 'rgba(107, 114, 128, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, Math.PI / 2, 3 * Math.PI / 2, false)
    ctx.stroke()
  }
}

// Redraw when zoom changes
watch(zoom, () => {
  drawBlackHole()
})

// Initial draw
onMounted(() => {
  drawBlackHole()
})

// Get distance from horizon in meters for a given n
// n = -log10((r - rs) / rs) => distance to horizon = rs * 10^(-n)
function getDistanceFromHorizonMeters(n: number): number {
  if (!isFinite(n)) return 0  // At horizon
  const rs_km = units.value.distanceToKm(1)
  const rs_meters = rs_km * 1000
  return rs_meters * Math.pow(10, -n)
}

const horizonEdgeX = RS_PIXELS * 2  // Right edge of horizon (where distance is 0)

// Calculate pixels per meter based on observer position and zoom
// This ensures observer is visible and everything scales proportionally
const pixelsPerMeter = computed(() => {
  const obsDistance = getDistanceFromHorizonMeters(props.nObserver)
  const obsScreenX = 800  // Observer at 800px from left edge at 1x zoom
  const baseScale = (obsScreenX - horizonEdgeX) / obsDistance
  return baseScale * zoom.value
})

// Calculate screen position for a given n
function getScreenX(n: number): number {
  const distanceFromHorizon = getDistanceFromHorizonMeters(n)
  return horizonEdgeX + (distanceFromHorizon * pixelsPerMeter.value)
}
const fallerX = computed(() => getScreenX(props.nCurrentFaller))
const observerX = computed(() => getScreenX(props.nObserver))

// Format distance for tooltip
function formatDistanceFromHorizon(n: number): string {
  const rs_km = units.value.distanceToKm(1)
  const distance_rs = Math.pow(10, -n)
  const distance_km = distance_rs * rs_km
  const distance_m = distance_km * 1000

  if (!isFinite(n) || distance_rs === 0) return 'at horizon'

  if (distance_m < 1e-9) return `${(distance_m * 1e12).toFixed(2)}pm`
  if (distance_m < 1e-6) return `${(distance_m * 1e6).toFixed(2)}μm`
  if (distance_m < 1) return `${(distance_m * 1e3).toFixed(2)}mm`
  if (distance_m < 1000) return `${distance_m.toFixed(2)}m`
  if (distance_m < 100000) return `${(distance_m / 1000).toFixed(2)}km`

  const AU = 1.496e11
  if (distance_m < AU * 1000) return `${(distance_m / AU).toFixed(2)}AU`

  return `${distance_m.toExponential(2)}m`
}
</script>

<template>
  <div class="w-full h-[300px] flex items-center relative overflow-hidden pl-8 pr-8">
    <!-- Distance scale grid (subtle background) -->
    <div class="absolute inset-0 flex items-center bg-[#1a1a2e] ml-[30px]">
      <div class="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
    </div>

    <!-- Main visualization area -->
    <div class="relative flex items-center">
      <!-- Black Hole Canvas (renders arc based on zoom) -->
      <canvas
        ref="blackHoleCanvas"
        :width="canvasWidth"
        :height="canvasHeight"
        class="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none"
      />

      <!-- Distance lines and labels -->
      <!-- Faller distance line -->
      <div
        class="absolute top-[17px] -translate-y-1/2 border-t border-dashed border-blue-400/50 flex items-center justify-center"
        :style="{
          left: `${horizonEdgeX}px`,
          width: `${fallerX - horizonEdgeX}px`
        }"
      >
        <span class="text-xs text-blue-300 font-mono mt-[15px]">{{ formatDistanceFromHorizon(nCurrentFaller) }}</span>
      </div>

      <!-- Observer distance line -->
      <div
        v-if="isFinite(nObserver)"
        class="absolute top-[20px] -translate-y-1/2 border-t border-dashed border-amber-400/50 flex items-center justify-center"
        :style="{
          left: `${horizonEdgeX}px`,
          width: `${observerX - horizonEdgeX}px`
        }"
      >
        <span class="text-xs text-amber-300/80 font-mono mt-[5px]">{{ formatDistanceFromHorizon(nObserver) }}</span>
      </div>

      <!-- Faller Object -->
      <div
        class="absolute top-[2px] -translate-y-1/2 -translate-x-1/2 z-10"
        :style="{ left: `${fallerX}px` }"
      >
        <div class="w-[10px] h-[10px] rounded bg-blue-400 shadow-lg shadow-blue-400/50 relative">
          <!-- Glow effect -->
          <div class="absolute inset-0 rounded bg-blue-400 blur-sm opacity-50"></div>
        </div>
        <!-- Label above -->
        <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span class="text-[10px] text-blue-400 font-medium">Faller</span>
        </div>
      </div>

      <!-- Observer Object -->
      <div
        v-if="isFinite(nObserver)"
        class="absolute top-[10px] -translate-y-1/2 -translate-x-1/2"
        :style="{ left: `${observerX}px` }"
      >
        <div class="w-[10px] h-[10px] rounded bg-amber-400 shadow-lg shadow-amber-400/50 relative">
          <!-- Glow effect -->
          <div class="absolute inset-0 rounded bg-amber-400 blur-sm opacity-30"></div>
        </div>
        <!-- Label above -->
        <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span class="text-[10px] text-amber-400 font-medium">Observer</span>
        </div>
      </div>
    </div>

    <!-- Scale info -->
    <div class="absolute bottom-4 left-12 text-[10px] text-gray-600 font-mono">
      Horizon radius: {{ units.distanceToKm(1).toFixed(2) }} km
    </div>

    <!-- Zoom controls -->
    <div class="absolute bottom-4 right-4 flex items-center gap-2">
      <span class="text-[10px] text-gray-600 font-mono">{{ zoom.toFixed(2) }}×</span>
      <div class="flex gap-1">
        <button
          @click="zoomOut"
          class="w-7 h-7 flex items-center justify-center text-xs bg-white/5 border border-white/10 text-gray-300 rounded hover:bg-white/10 transition-colors"
        >−</button>
        <button
          @click="resetZoom"
          class="w-7 h-7 flex items-center justify-center text-[10px] bg-white/5 border border-white/10 text-gray-300 rounded hover:bg-white/10 transition-colors"
        >⟲</button>
        <button
          @click="zoomIn"
          class="w-7 h-7 flex items-center justify-center text-xs bg-white/5 border border-white/10 text-gray-300 rounded hover:bg-white/10 transition-colors"
        >+</button>
      </div>
    </div>
  </div>
</template>
