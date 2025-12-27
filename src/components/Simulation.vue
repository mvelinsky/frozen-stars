<script setup lang="ts">
import { computed } from 'vue'
import type { IBlackHoleEngine } from '../engine/BlackHoleEngine'
import type { EngineState, PhotonState } from '../engine/types'

interface Props {
  engine: IBlackHoleEngine | null
  state: EngineState | null
  photons: Array<{ tauEmit: number; current: PhotonState }>
  observerMode: 'object1' | 'object2'
}

const props = defineProps<Props>()

// Canvas dimensions
const width = 600
const height = 500

// Calculate vertical position for a given radius
const yForRadius = (r: number, rs: number, maxR: number): number => {
  const padding = 60
  const availableHeight = height - padding * 2
  // Map from [rs, maxR] to [height - padding, padding]
  const t = (r - rs) / (maxR - rs)
  return height - padding - t * availableHeight
}

// SVG elements for visualization
const svgContent = computed(() => {
  if (!props.engine || !props.state) return ''

  console.log(props.engine.cfg);
  const rs = props.engine.cfg.rs
  const r0 = props.engine.cfg.n0
  const r2 = props.engine.cfg.n2

  // Use max of r2 and r0 as the top of visualization
  const maxR = Math.max(r2, r0) * 1.2

  // Positions
  const centerX = width / 2
  const horizonY = yForRadius(rs, rs, maxR)
  const object1Y = yForRadius(props.state.object1.r, rs, maxR)
  const object2Y = yForRadius(r2, rs, maxR)

  // Build SVG
  let svg = ''

  // Background gradient
  svg += `<defs>
    <radialGradient id="bhGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000" />
      <stop offset="70%" stop-color="#1a1a2e" />
      <stop offset="100%" stop-color="#0a0a0f" />
    </radialGradient>
    <linearGradient id="horizonGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ff6b35" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#ff6b35" stop-opacity="0" />
    </linearGradient>
  </defs>`

  // Background
  svg += `<rect width="${width}" height="${height}" fill="url(#bhGradient)" />`

  // Distance markers (grid lines)
  for (let i = 0; i <= 10; i++) {
    const r = rs + (maxR - rs) * (i / 10)
    const y = yForRadius(r, rs, maxR)
    svg += `<line x1="50" y1="${y}" x2="${width - 50}" y2="${y}" stroke="#333" stroke-width="1" stroke-dasharray="4,4" />`
    if (i % 2 === 0) {
      svg += `<text x="${width - 45}" y="${y + 4}" fill="#555" font-size="11" text-anchor="end">r = ${r.toFixed(1)}</text>`
    }
  }

  // Black hole (below horizon)
  const bhHeight = height - horizonY + 50
  svg += `<ellipse cx="${centerX}" cy="${height + bhHeight/2 - 50}" rx="${rs * 3}" ry="${bhHeight}" fill="#000" />`

  // Event horizon line with glow
  svg += `<line x1="${centerX - 100}" y1="${horizonY}" x2="${centerX + 100}" y2="${horizonY}" stroke="#ff6b35" stroke-width="3" />`
  svg += `<line x1="${centerX - 120}" y1="${horizonY}" x2="${centerX + 120}" y2="${horizonY}" stroke="url(#horizonGlow)" stroke-width="8" />`
  svg += `<text x="${centerX + 130}" y="${horizonY + 4}" fill="#ff6b35" font-size="14" font-weight="bold">Event Horizon (rs = ${rs.toFixed(2)})</text>`

  // Path line (trajectory)
  svg += `<line x1="${centerX}" y1="${horizonY}" x2="${centerX}" y2="${object2Y}" stroke="#444" stroke-width="2" />`

  // Photons
  for (const photon of props.photons) {
    const photonY = yForRadius(photon.current.r, rs, maxR)
    const opacity = photon.current.hasArrived ? 0 : 1
    svg += `<circle cx="${centerX + 15}" cy="${photonY}" r="5" fill="#ffff00" opacity="${opacity}">
      <animate attributeName="cy" from="${yForRadius(photon.current.r, rs, maxR)}" to="${photonY - 5}" dur="0.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
    </circle>`
    // Photon trail
    svg += `<line x1="${centerX + 15}" y1="${photonY}" x2="${centerX + 15}" y2="${photonY + 15}" stroke="#ffff00" stroke-width="1" opacity="0.3" />`
  }

  // Object 2 (stationary observer)
  svg += `<g>
    <circle cx="${centerX}" cy="${object2Y}" r="16" fill="#4a9eff" stroke="#fff" stroke-width="2" />
    <text x="${centerX + 25}" y="${object2Y + 5}" fill="#4a9eff" font-size="14" font-weight="bold">Object 2</text>
    <text x="${centerX + 25}" y="${object2Y + 22}" fill="#666" font-size="12">(stationary observer)</text>
  </g>`

  // Object 1 (infalling object)
  const obj1Color = props.state.hasReachedHorizon ? '#ff4444' : '#44ff88'
  svg += `<g>
    <circle cx="${centerX}" cy="${object1Y}" r="14" fill="${obj1Color}" stroke="#fff" stroke-width="2">
      ${!props.state.hasReachedHorizon ? `<animate attributeName="r" values="14;16;14" dur="2s" repeatCount="indefinite" />` : ''}
    </circle>
    <text x="${centerX - 25}" y="${object1Y + 5}" fill="${obj1Color}" font-size="14" font-weight="bold" text-anchor="end">Object 1</text>
    <text x="${centerX - 25}" y="${object1Y + 22}" fill="#666" font-size="12" text-anchor="end">(infalling)</text>
  </g>`

  // Distance display for Object 1
  const delta1 = props.state.object1.r - rs
  let distanceText1 = `δ = ${delta1.toFixed(4)} rs`
  if (props.state.object1.n > 15) {
    distanceText1 = `δ = 10^(-${props.state.object1.n.toFixed(1)}) rs`
  }
  svg += `<text x="${centerX - 25}" y="${object1Y - 20}" fill="#888" font-size="11" text-anchor="end">${distanceText1}</text>`

  // Observer mode indicator
  const modeText = props.observerMode === 'object1' ? 'View: Object 1 (infalling)' : 'View: Object 2 (stationary)'
  svg += `<rect x="20" y="20" width="200" height="30" rx="5" fill="${props.observerMode === 'object1' ? '#2a4a3a' : '#2a3a5a'}" stroke="${props.observerMode === 'object1' ? '#44ff88' : '#4a9eff'}" stroke-width="1" />`
  svg += `<text x="120" y="40" fill="#fff" font-size="13" text-anchor="middle" font-weight="bold">${modeText}</text>`

  // Scale indicator
  svg += `<text x="20" y="${height - 20}" fill="#555" font-size="11">Scale: Logarithmic near horizon</text>`

  return svg
})
</script>

<template>
  <div class="simulation">
    <svg
      :width="width"
      :height="height"
      viewBox="0 0 600 500"
      xmlns="http://www.w3.org/2000/svg"
      v-html="svgContent"
    />
  </div>
</template>

<style scoped>
.simulation {
  background: #0a0a0f;
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
}

svg {
  display: block;
}
</style>
