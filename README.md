# Veale's Velodrome

**An interactive MLB pitch mechanics trainer inspired by Pirates legend Bob Veale.**

Master the four core pitches through animated arm mechanics, real-time ball spin visualization, 
and progressive drills — from fidget-friendly passive exercises to full-velocity training programs.

## What Is This?

Veale's Velodrome is a web-based pitch mechanics lab where you can:

- **Animate arm motion** from three angles (facing pitcher, arm-side, behind) with left/right 
  handedness, play/pause, and variable speed (0.5–2×)
- **Visualize ball spin** with animated seams showing backspin, topspin, and gyroscopic rotation 
  synced to release mechanics
- **Watch wrist action** in real-time — load angles, snaps, pronation — with degree readout
- **Follow a mastery progression path**: Start with the 4-seam fastball (70%+ accuracy gate), 
  then unlock the curveball, changeup, and slider in sequence
- **Access drills at every level**:
  - **Passive**: Spin a baseball in class, at a game, while watching film — no equipment needed
  - **Active**: Short-toss mechanics work, spin-axis audits, disguise checks from the bullpen
  - **Strength**: Progressive rotator cuff, pronation, scapular stability, and core routines

## Why Bob Veale?

The Vulture was the Pirates' ace of the 1960s–70s, famous for throwing *heat* (100+ mph in his era) 
and arguably the most devastating curveball of his generation. He won 21 games in 1966, led the 
National League in strikeouts twice, and struck fear into hitters across the National League. 

Veale's Velodrome honors that legacy: a space where pitchers can understand, master, and 
feel confident with their best stuff.

## Quick Start

**As a web artifact (claude.ai):**
Copy `mlb-mechanics-trainer.jsx` into any React app.

**As a Vite project (Claude Code / local development):**
```bash
npm create vite@latest veales-velodrome -- --template react
cd veales-velodrome
npm install
# Copy mlb-mechanics-trainer.jsx → src/App.jsx
npm run dev
```

## Features

| Feature | Details |
|---------|---------|
| **4 Pitches** | 4-Seam Fastball, Curveball, Changeup, Slider |
| **3 Views** | Facing pitcher, arm-side, behind pitcher |
| **2 Handedness** | RHP and LHP (full mirroring) |
| **Real-time Sync** | Arm motion, wrist action, ball spin all frame-locked |
| **Mastery Gates** | Prerequisites before unlocking the next pitch |
| **60+ Drills** | Passive, active, and strength-focused |
| **Dark UI** | Pitch-themed accent colors, accessible dark theme |
| **No Dependencies** | Pure React + CSS — runs anywhere |
## The Four Pitches

Build your arsenal in order. Each pitch unlocks only after mastering prerequisites.

### 1️⃣ Four-Seam Fastball
**#2563EB** — The Foundation  
*88–102 mph · 35–42 rps · Backspin*

The fastball is your identity. Master arm slot, release consistency, and finger pressure before 
touching any other pitch. Index + middle fingers perpendicular to the horseshoe seam. Magnus 
effect creates perceived "rise." No wrist action — pure extension.

**Gate to Curveball:** 70%+ target accuracy

---

### 2️⃣ Curveball
**#7C3AED** — The Strikeout Pitch  
*70–82 mph · 40–45 rps · Topspin (12→6 drop)*

The Vulture's calling card. A hard 12-to-6 wrist snap at release separates this from the fastball. 
Middle finger runs along the seam (not across). Wrist cocked inward during load, then explosive 
snap down. 10–14 inches of drop in the final 5 feet. Hitters swing and miss.

**Gate to Changeup:** Solid 4-seam arm path required

---

### 3️⃣ Changeup
**#D97706** — The Deception  
*76–88 mph · 20–28 rps · Arm-side fade*

Your secret weapon. The arm speed must look identical to your fastball — that's the entire pitch. 
Circle Change grip (thumb + index OK sign) buries the ball deep in your palm. Natural pronation 
(wrist turning over) at release kills velocity without any conscious deceleration. Hitters think 
fastball, commit early, miss.

**Gate to Slider:** Convincing arm action required — if your armspeed changes visibly, batters will see it

---

### 4️⃣ Slider
**#DC2626** — The Closer  
*80–92 mph · 38–43 rps · Gyroscopic (late lateral break)*

The dart. Fingers shifted off-center toward the outer seam. At release, your hand cuts across 
and outside the ball — like shaking hands and pulling away. Gyroscopic spin axis (tilted ~45°) 
creates tight, late movement in the last 5–10 feet. Unhittable when it's right.

**Gate:** Require solid 4-seam arm path; **never** throw with fatigue (lateral stress is highest of all four)

---

## Use Cases

- **Youth pitchers**: Visual feedback on arm slot, release point consistency, spin axis
- **High school / college coaches**: Teaching mechanics in the bullpen or film room
- **Neurodivergent students**: Fidget-friendly passive drills for focus and stimulation during class
- **Rehab athletes**: Progressive mechanics work post-injury
- **Baseball parents**: Understanding what your kid is working on

## Architecture

- **Animation**: `requestAnimationFrame` loop, 3.2s cycle, smooth interpolation
- **Arm keyframes**: Shoulder → elbow → wrist offsets, 9-frame sequence per view
- **Pitch-specific modifiers**: Wrist snap/pronation/cut applied at release window
- **Spin visualization**: CSS keyframe rotation + seam path SVG
- **Drills database**: 60+ indexed exercises, grouped by phase and intensity

See `HANDOFF_FOR_CLAUDE_CODE.md` for full technical spec.

## Extending Veale's Velodrome

Suggested future work:
- **3D arm model** (Three.js skeleton + OrbitControls)
- **Statcast data integration** (real-world spin numbers from famous Pirates pitchers)
- **Side-by-side pitch comparison** (see arm path differences in real-time)
- **Mobile grip tracking** (device camera + pose estimation for grip feedback)
- **Audio cues** (pop sound at release, curveball "whistle")

## Credits

**Inspired by:**
- Bob Veale, Pirates pitcher (1960–1972), The Vulture
- MLB Statcast, Rapsodo, and TrackMan pitch metrics
- The 1960 Pirates World Series championship rotation

**Built with:** React, SVG, CSS animations, vanilla JavaScript keyframe interpolation

## License

TBD

---

*Veale's Velodrome: Where pitches are built, not bought.*
