import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

// ─── UTILS ────────────────────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const interpKF = (frames, t) => {
  for (let i = 0; i < frames.length - 1; i++) {
    const t0 = frames[i][0], t1 = frames[i + 1][0];
    if (t >= t0 && t <= t1) {
      const e = ease((t - t0) / (t1 - t0));
      return frames[i].slice(1).map((v, j) => lerp(v, frames[i + 1][j + 1], e));
    }
  }
  return frames[frames.length - 1].slice(1);
};

// ─── PITCH DATA ───────────────────────────────────────────────────────────────
const PITCHES = [
  {
    id: 0, order: 1, name: "Four-Seam Fastball", short: "4-Seam", accent: "#2563EB",
    family: "Velocity", velo: "88–102 mph", rpm: "2,100–2,500 rpm", pitchBreak: "Minimal — Magnus \"hop\"",
    prereq: null, prereqLabel: null,
    spinType: "BACKSPIN", spinDir: "cw", spinHz: "35–42 rps",
    spinAxis: "Horizontal axis — ball rotates backward (top toward pitcher). Magnus effect fights gravity, creating perceived rise.",
    releaseLabel: "Wrist stays firm and neutral. Both fingerpads push straight through the back of the ball simultaneously. Zero deviation.",
    badges: ["Backspin", "Max velocity", "4 seam contact"],
    gripSummary: "Index + Middle finger pads placed perpendicular to the horseshoe seam. Thumb underneath for support. No wrist pronation.",
    delivery: {
      summary: "Straight over-the-top release. The wrist stays firm and neutral — no snap, no twist. Pure extension through the target.",
      mechanics: [
        "Arm travels full arc — 12 o'clock release point",
        "Wrist firm, fingers directly behind the ball at release",
        "Backspin creates Magnus effect — perceived \"rise\"",
        "Follow-through drives toward plate",
      ],
      whyItWorks: "Four seams rotating backward create maximum Magnus lift, fighting gravity and arriving higher in the zone than hitters expect.",
    },
    armPaths: {
      paths: [
        { d: "M 20 100 Q 60 20 100 28", main: true, release: [100, 28] },
        { d: "M 100 28 L 190 28", main: false, dash: true },
      ],
      labels: [
        { x: 55, y: 115, text: "Arm arc" },
        { x: 148, y: 22, text: "→ plate" },
        { x: 100, y: 18, text: "12 o'clock release", anchor: "middle" },
      ],
    },
  },
  {
    id: 1, order: 2, name: "Curveball", short: "Curve", accent: "#7C3AED",
    family: "Breaking Ball", velo: "70–82 mph", rpm: "2,400–2,700 rpm", pitchBreak: "10–14\" 12→6 drop",
    prereq: 0, prereqLabel: "Master 4-seam to 70%+ target accuracy before adding this.",
    spinType: "TOPSPIN", spinDir: "ccw", spinHz: "40–45 rps",
    spinAxis: "Horizontal axis (reversed) — ball tumbles forward toward catcher. Magnus force drives it sharply downward 10–14\".",
    releaseLabel: "Wrist cocked INWARD during load, then hard 12→6 snap at release. Middle finger pulls through and down.",
    badges: ["Topspin", "12→6 break", "Wrist snap"],
    gripSummary: "Middle finger runs along the seam (not across it). Index finger adjacent. Wrist cocked inward at load.",
    delivery: {
      summary: "Wrist rolls over the top at release — a decisive snap downward from 12 to 6 o'clock. The arm path mirrors a fastball until the last moment.",
      mechanics: [
        "Wrist cocked inward during windup",
        "Release point slightly in front of fastball",
        "Middle finger pulls down hard — wrist snaps 12→6",
        "Topspin accelerates downward break",
      ],
      whyItWorks: "Topspin causes Magnus force to work against the ball, driving it sharply downward. Fastball-like arm action hides the pitch until it's too late.",
    },
    armPaths: {
      paths: [
        { d: "M 20 100 Q 55 25 95 30", main: true, release: [95, 30] },
        { d: "M 95 30 Q 130 50 150 90", main: false, dash: true },
      ],
      labels: [
        { x: 48, y: 115, text: "Arm arc" },
        { x: 128, y: 110, text: "12→6 break" },
        { x: 95, y: 20, text: "snap down", anchor: "middle" },
      ],
    },
  },
  {
    id: 2, order: 3, name: "Changeup", short: "Change", accent: "#D97706",
    family: "Off-Speed", velo: "76–88 mph", rpm: "1,200–1,700 rpm", pitchBreak: "Arm-side fade",
    prereq: 0, prereqLabel: "Requires convincing 4-seam arm action first. If batters can read your arm, velocity gap won't save you.",
    spinType: "REDUCED BACKSPIN", spinDir: "cw", spinHz: "20–28 rps",
    spinAxis: "Similar axis to fastball but ~half the rpm + slight tilt. Natural pronation causes arm-side run and fade.",
    releaseLabel: "ARM SPEED = FASTBALL. Deep palm grip kills velocity naturally. Wrist pronates (palm turns over) after ball exits.",
    badges: ["Deep palm grip", "Arm-speed mimic", "Natural pronate"],
    gripSummary: "Circle Change: thumb + index form an \"OK\" ring on the ball's side. Three fingers spread across the top. Ball sits deep in the palm.",
    delivery: {
      summary: "The arm action is indistinguishable from a fastball — same speed, same path. The deep palm grip and natural pronation do the work, not the arm.",
      mechanics: [
        "Arm speed identical to fastball (this is the entire deception)",
        "Ball buried deep in palm — reduces velocity naturally",
        "Wrist naturally pronates at release (turns palm outward)",
        "No snapping — the grip controls everything",
      ],
      whyItWorks: "Hitters read arm speed to time pitches. A changeup with perfect fastball arm action triggers an early swing. The 10–15 mph gap does the rest.",
    },
    armPaths: {
      paths: [
        { d: "M 20 100 Q 60 20 100 28", main: true, release: [100, 28] },
        { d: "M 100 28 Q 140 30 185 45", main: false, dash: true },
      ],
      labels: [
        { x: 55, y: 115, text: "Fastball arm ≡" },
        { x: 148, y: 55, text: "arm-side fade" },
        { x: 100, y: 18, text: "pronate out", anchor: "middle" },
      ],
    },
  },
  {
    id: 3, order: 4, name: "Slider", short: "Slider", accent: "#DC2626",
    family: "Breaking Ball", velo: "80–92 mph", rpm: "2,300–2,600 rpm", pitchBreak: "4–8\" late lateral",
    prereq: 0, prereqLabel: "Solid 4-seam arm path required. Do NOT throw with fatigue — lateral stress is significantly higher.",
    spinType: "GYROSCOPIC", spinDir: "gyro", spinHz: "38–43 rps",
    spinAxis: "Axis tilted ~45° — spirals like a football. Gyroscopic spin produces late, tight lateral break in final 5–10 feet.",
    releaseLabel: "Outside edge of middle finger shaves ball at release. Pull hand back as if shaking hands and cutting away.",
    badges: ["Gyroscopic spin", "Late break", "Cut release"],
    gripSummary: "Fingers shifted off-center toward the outer seam. Tighter gap than a fastball. Primary pressure on the outside of the middle finger.",
    delivery: {
      summary: "The hand cuts across and outside the ball at release — like turning a doorknob outward. Arm path looks like a fastball until the very last inch.",
      mechanics: [
        "Fingers positioned off-center at load",
        "Release cuts outside-to-in — wrist tilts, doesn't snap",
        "Gyroscopic spin creates tight, late lateral movement",
        "Faster and later break than a curveball",
      ],
      whyItWorks: "Off-axis gyro spin produces a dart-like break in the final 5–10 feet. Hitters can't react — the ball appears to be a fastball until it isn't.",
    },
    armPaths: {
      paths: [
        { d: "M 20 100 Q 58 22 98 30", main: true, release: [98, 30] },
        { d: "M 98 30 Q 140 28 185 55", main: false, dash: true },
      ],
      labels: [
        { x: 53, y: 115, text: "Arm arc" },
        { x: 148, y: 68, text: "lateral cut" },
        { x: 98, y: 20, text: "cut outside-in", anchor: "middle" },
      ],
    },
  },
];

// Arm keyframes: [t, elbowDx, elbowDy, wristDx, wristDy] — offsets from shoulder.
// Defined for RHP. For LHP, negate all Dx values.
const ARM_KF = {
  front: [
    [0.00, +5,  +37, +8,  +72],
    [0.10, -18, +12, -35, +30],
    [0.26, -32, -6,  -56, -18],
    [0.43, -30, -38, -44, -65],
    [0.58, -10, -28, +5,  -38],
    [0.70, +8,  -8,  +18, -13],
    [0.80, +28, +7,  +52, +18],
    [0.92, +38, +40, +58, +72],
    [1.00, +5,  +37, +8,  +72],
  ],
  side: [
    [0.00, -8,  +38, -12, +72],
    [0.10, -15, +12, -25, +5 ],
    [0.26, -52, +5,  -88, -12],
    [0.43, -46, -28, -77, -60],
    [0.58, -18, -32, +12, -58],
    [0.70, +28, -18, +60, -30],
    [0.80, +42, +10, +72, +28],
    [0.92, +32, +45, +28, +78],
    [1.00, -8,  +38, -12, +72],
  ],
  back: [
    [0.00, +5,  +37, +8,  +72],
    [0.10, +18, +12, +35, +30],
    [0.26, +32, -6,  +56, -18],
    [0.43, +30, -38, +44, -65],
    [0.58, +10, -28, -5,  -38],
    [0.70, -8,  -8,  -18, -13],
    [0.80, -28, +7,  -52, +18],
    [0.92, -38, +40, -58, +72],
    [1.00, +5,  +37, +8,  +72],
  ],
};

const SHOULDER_X = {
  front: { R: 110, L: 170 },
  back:  { R: 170, L: 110 },
  side:  { R: 140, L: 140 },
};

const WRIST_MOD = {
  0: { dx: 0,   dy: 0   },
  1: { dx: -5,  dy: +22 },
  2: { dx: +14, dy: +6  },
  3: { dx: -12, dy: -8  },
};

const PHASES = [
  [0.00, 0.09, "Set Position"],
  [0.09, 0.20, "Wind-Up"],
  [0.20, 0.37, "Stride / Arm Separation"],
  [0.37, 0.52, "High-Cock · Max Ext. Rotation"],
  [0.52, 0.65, "Acceleration"],
  [0.65, 0.78, "Release"],
  [0.78, 1.00, "Follow-Through"],
];

const WRIST_STATES = {
  0: { load: 0,   release: 0,   loadLabel: "NEUTRAL",       releaseLabel: "PUSH THROUGH" },
  1: { load: -48, release: 105, loadLabel: "COCKED INWARD", releaseLabel: "SNAP 12→6 ↓" },
  2: { load: 0,   release: -62, loadLabel: "NEUTRAL",       releaseLabel: "PRONATE OUT"  },
  3: { load: -20, release: 52,  loadLabel: "SLIGHT TILT",   releaseLabel: "CUT ACROSS"   },
};

// ─── DRILLS DATA ──────────────────────────────────────────────────────────────
const DRILLS = {
  0: {
    passive: [
      { title: "Seam Sensor", desc: "Rotate ball slowly between index and middle fingerpads. Feel each seam ridge cross evenly. Uneven feel → uneven pressure → cutting spin. Do this through any game, class, or meeting." },
      { title: "Table Backspin", desc: "4-seam grip on any flat surface. Spin the ball so it rolls toward you (backspin). Perfect spin = dead-straight roll, zero wobble. This is exactly what the ball does at 90 mph in flight." },
      { title: "Wrist Snap Pop", desc: "Hold ball loosely. Snap wrist straight forward, release. Listen for a clean pop as pads brush through. A dull thud = sliding, not spinning. No sound = releasing too early. The pop is the fastball." },
      { title: "Pressure Shift", desc: "Intentionally squeeze only your index finger — ball cuts to glove side. Switch to middle only — cuts the other way. Equal pressure = pure backspin. This is how catchers diagnose a pitcher's delivery." },
    ],
    active: [
      { title: "One-Knee Drill", desc: "Throw-side knee on ground, glove-side foot forward. Removes all leg mechanics — pure arm action. Focus: arm slot above shoulder, fingers directly behind the ball, same slot every throw. 3×15 reps." },
      { title: "Wall Backspin Check", desc: "Stand 4 feet from a smooth wall. Throw easy 4-seamers. True backspin returns in a straight line. Wobble or lateral drift = finger pressure imbalance. Drill until every return is clean." },
      { title: "4-Corner Targeting", desc: "Tape 4 zones: low arm-side, low glove-side, high arm-side, high glove-side. Work through the sequence. Track hit rate. Goal: 70%+ before introducing any second pitch. Document your baseline." },
      { title: "Video Release Check", desc: "Slow-motion from behind or side. At release frame: elbow at or above shoulder. Palm faces catcher. Ball exits from the fingerpad, not the tip. These three together = a repeatable 4-seam." },
    ],
    strength: [
      { group: "Rotator Cuff", exercises: ["External rotation with band, elbow at 90° (3×15 each)", "Side-lying IR/ER alternating (3×12)", "Prone Y-T-W on bench (3×10 each letter)"] },
      { group: "Scapular Stability", exercises: ["Serratus push-up plus (3×12)", "Band pull-apart (3×20)", "Wall slides / overhead shrug (3×12)"] },
      { group: "Wrist & Forearm", exercises: ["Wrist curls + reverse wrist curls (3×20 each)", "Rubber band finger extension (3×20)", "Supination/pronation with light dumbbell (3×15 each direction)"] },
      { group: "Core & Hip Rotation", exercises: ["Pallof press (3×12 each side)", "Med ball rotational wall slam (3×10 each side)", "Hip 90-90 mobility daily (2 min each side)"] },
    ],
  },
  1: {
    passive: [
      { title: "Doorknob Snap", desc: "Curve grip, arm relaxed at side. Snap the wrist as if turning a doorknob from 12 to 6 o'clock. Middle finger leads. Feel the ball roll off the middle fingertip, not the palm. 20 reps." },
      { title: "Topspin Table Roll", desc: "Opposite of the fastball drill — ball rolls AWAY from you. If it rolls toward you, you threw a fastball. This is instantly obvious. Drills the snap muscle memory in isolation with immediate feedback." },
      { title: "Wrist Lock Hold", desc: "Cock wrist inward (palm faces your ear — supination). Hold 10 seconds. This is the LOADED curveball position. Notice the tension on your outer forearm. Release to neutral. 15 reps." },
      { title: "Pencil Roll", desc: "Hold a pencil vertically between middle and ring fingers. Execute the 12→6 snap. The pencil tip traces a forward arc. Isolates wrist action without ball-grip muscle memory interfering." },
    ],
    active: [
      { title: "Short-Toss Spin Focus", desc: "From 20 feet, 40% effort. Focus entirely on spin quality — not velocity, not location. Watch the ball tumble forward in flight (true topspin). Loopy tumbling break = correct. Late side-snap = finger is sliding." },
      { title: "One-Knee Curve", desc: "Same as 4-seam one-knee drill with curve grip. Slow and deliberate. Film from the side: the wrist snap should happen IN FRONT of the body. Snapping behind the body creates spin without break." },
      { title: "50% Velocity Curve", desc: "Half-effort throws remove compensation mechanics. The snap must generate all the spin on its own. Move to 75% only when every throw produces consistent 12→6 tumble." },
      { title: "Spin Axis Audit", desc: "With Rapsodo or Trackman: target spin axis 12:00–1:00. High gyro% means spin is wasted on sideways wobble (acts like a slider). Fix: commit harder to the over-the-top snap." },
    ],
    strength: [
      { group: "Wrist Flex / Extend", exercises: ["Wrist flexion curls, heavier (3×15)", "Eccentric wrist extension, slow negative (3×12)", "Towel wringing isometric hold (3×20s)"] },
      { group: "Pronation / Supination", exercises: ["Supination TheraBand (3×15)", "Pronation/supination dumbbell rotation (3×15 each direction)", "Flexbar Tyler Twist (2×15)"] },
      { group: "Elbow Health", exercises: ["Eccentric elbow flexion, slow negative (3×12)", "TRX elbow extension (3×12)", "Daily stretch: wrist flexors + forearm extensors (30s × 3)"] },
    ],
  },
  2: {
    passive: [
      { title: "Circle Hold", desc: "Form the OK sign (thumb + index circle) around the ball. Hold for 30+ seconds until the grip is reflexive. You cannot think about grip under game speed — it has to be completely automatic." },
      { title: "Palm Toss", desc: "Ball deep in palm, changeup grip. Toss gently to a wall 3 feet away. Ball should leave the PALM, not the fingers. A soft, muffled release confirms the ball is buried deep enough." },
      { title: "Shadow Arm Match", desc: "Shadow-throw a fastball. Shadow-throw a changeup. Have someone try to identify which is which by arm action alone. If they can tell — they will at first — keep drilling. Arms must be indistinguishable." },
      { title: "Pronation Feel", desc: "Hold arm out, palm up. Rotate until palm faces down. That is pronation — what happens naturally at changeup release. Practice 20× until fluid. Don't fight it; letting it happen IS the pitch." },
    ],
    active: [
      { title: "Velocity Gap Test", desc: "Radar gun or app: throw 4-seam then changeup. Target: 10–15+ mph gap. Under 8 mph = ball too shallow in palm. If gap is good but arm decelerates visibly, film yourself — the slow-down is usually visible from stride." },
      { title: "Late-Call Drill", desc: "Partner calls 'fastball' or 'change' AFTER you start your windup. Decelerating on the change call is a mechanical tell. Visible to any experienced hitter. Fix this in drills before it appears in games." },
      { title: "Mirror Drill", desc: "Film from first-base side (RHP) at slow-mo. From stride landing to ball release, arm action should be pixel-identical between 4-seam and changeup. Even 5% slow-down is enough for a hitter to key on." },
      { title: "Fade Zone Work", desc: "Throw changeups to arm-side low corner. Natural pronate-and-run moves the ball there automatically. Learn to use this movement instead of fighting it — a changeup that fades arm-side low is maximally deceptive." },
    ],
    strength: [
      { group: "Grip & Hand", exercises: ["Heavy gripper (3×20 each hand)", "Fingertip plate pinch (3×30s each hand)", "Dead hangs for grip endurance (3×max)"] },
      { group: "Palm / Intrinsic Muscles", exercises: ["Towel scrunch (3×20)", "Rubber band finger abduction (3×15)", "Marble pickup (2 min each hand)"] },
      { group: "Pronation Health", exercises: ["Pronation TheraBand (3×15)", "Wrist mobility: palmar & dorsiflexion stretches daily (30s × 3)", "Shoulder ER stretch for arm-side health (30s × 3 each)"] },
    ],
  },
  3: {
    passive: [
      { title: "Outer Edge Press", desc: "Slider grip. Press the OUTER EDGE of your middle finger into the ball surface — not the tip, the outside edge. Hold firm. This is the only finger touching the ball at release. 20-rep holds, daily." },
      { title: "Handshake-and-Pull", desc: "Extend arm as if to shake hands (thumb up). Now pull your hand back laterally, as if shaking someone's hand and cutting away. That motion IS the slider release. The ball rolls off the outside finger edge." },
      { title: "Football Spiral", desc: "Throw a football (or spin the baseball) in a tight spiral. The wrist tilt and off-center finger pressure for a football spiral are nearly identical to slider mechanics. This feel transfers directly." },
      { title: "Spin a Top", desc: "Flick the ball with your off-center grip like spinning a top. Ball should spiral on the surface — not roll forward (fastball), not tumble over (curve). Surface spiral = gyroscopic spin = correct." },
    ],
    active: [
      { title: "Cutter Progression", desc: "Start with a cutter: fingers barely off-center, minimal wrist tilt. Get comfortable. Gradually shift further off-center over weeks. The slider is an evolved cutter, not a different pitch. Learn the full spectrum." },
      { title: "Flight Break Audit", desc: "Throw at a backstop. Watch the flight. True slider: late, tight, sharp lateral break. Loopy = too much curveball influence (reduce wrist tilt). Straight = not enough cut (more outside-edge pressure)." },
      { title: "Short Distance Drill", desc: "Sliders from 40 feet. Shorter distance exaggerates the cut feel and makes spin axis feedback immediate. Once break is consistent at 40 feet, return to full distance and verify it held." },
      { title: "Disguise Check", desc: "Have a hitter watch your 4-seam and slider from the box. If they can identify the slider before 15 feet from release, your arm path or grip is leaking. It must look like a fastball until late." },
    ],
    strength: [
      { group: "Lateral Wrist", exercises: ["Radial/ulnar deviation with dumbbell (3×15 each direction)", "Side wrist curls (3×12)", "Reverse curl superset with regular curl (3×15)"] },
      { group: "Supinator", exercises: ["Supination TheraBand (3×15)", "Dumbbell supination curl (3×12)", "Isometric supination hold (3×15s)"] },
      { group: "Posterior Arm Health", exercises: ["Cross-body posterior shoulder stretch (30s × 3 each)", "Sleeper stretch (30s × 3 each side)", "Full rotator cuff program maintained throughout"] },
    ],
  },
};

// ─── ANIMATION HOOK ───────────────────────────────────────────────────────────
function useAnimT(playing, speed) {
  const [animT, setAnimT] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!playing) return;
    const duration = 3200 / speed;
    const loop = (ts) => {
      if (!startRef.current) startRef.current = ts;
      setAnimT(((ts - startRef.current) % duration) / duration);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [playing, speed]);

  return animT;
}

// ─── THREE.JS HELPERS ─────────────────────────────────────────────────────────
const _up3  = new THREE.Vector3(0, 1, 0);
const _dir3 = new THREE.Vector3();
const _mid3 = new THREE.Vector3();
function updateLimb(mesh, start, end) {
  _dir3.subVectors(end, start);
  const len = _dir3.length();
  if (len < 0.001) { mesh.visible = false; return; }
  mesh.visible = true;
  mesh.scale.y = len;
  _mid3.addVectors(start, end).multiplyScalar(0.5);
  mesh.position.copy(_mid3);
  mesh.quaternion.setFromUnitVectors(_up3, _dir3.normalize());
}

function offsetTo3D(view, dx, dy) {
  if (view === "side") return new THREE.Vector3(0, -dy / 10, -dx / 10);
  return new THREE.Vector3(dx / 10, -dy / 10, 0);
}

const CAM_POSITIONS = {
  front: new THREE.Vector3(0,  0,  30),
  side:  new THREE.Vector3(30, 0,   0),
  back:  new THREE.Vector3(0,  0, -30),
};

// ─── STICK FIGURE (THREE.JS) ──────────────────────────────────────────────────
function PitcherFigure({ pitchId, view, hand, animT }) {
  const p = PITCHES[pitchId];
  const canvasRef   = useRef(null);
  const containerRef = useRef(null);
  const sceneRef    = useRef(null);

  // ── One-time setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x13151c);

    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(5, 10, 10);
    scene.add(dirLight);

    const camera = new THREE.OrthographicCamera(-13, 13, 7, -21, 0.1, 100);
    camera.position.copy(CAM_POSITIONS.front);
    camera.lookAt(0, -7, 0);

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf0eee9, transparent: true, opacity: 0.65,
    });
    const dimMat = new THREE.MeshStandardMaterial({
      color: 0xf0eee9, transparent: true, opacity: 0.35,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb, emissive: 0x2563eb, emissiveIntensity: 0.35,
    });
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xf5e6d0 });

    const makeSphere = (r, mat) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
      scene.add(m); return m;
    };
    const makeLimb = (r, mat) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 8), mat);
      scene.add(m); return m;
    };

    // Joints
    const headMesh      = makeSphere(0.95, bodyMat);
    const shoulderMesh  = makeSphere(0.55, accentMat);
    const elbowMesh     = makeSphere(0.45, accentMat);
    const wristMesh     = makeSphere(0.60, accentMat);
    const ballMesh      = makeSphere(0.38, ballMat);
    const gloveWristMesh = makeSphere(0.35, dimMat);

    // Limbs
    const torsoMesh       = makeLimb(0.38, bodyMat);
    const hipMesh         = makeLimb(0.22, bodyMat);
    const pivThighMesh    = makeLimb(0.30, dimMat);
    const pivShinMesh     = makeLimb(0.28, dimMat);
    const strideThighMesh = makeLimb(0.30, bodyMat);
    const strideShinMesh  = makeLimb(0.28, bodyMat);
    const gloveUpperMesh  = makeLimb(0.22, dimMat);
    const gloveForeArmMesh = makeLimb(0.20, dimMat);
    const upperArmMesh    = makeLimb(0.32, accentMat);
    const forearmMesh     = makeLimb(0.28, accentMat);

    // Ground line
    const groundGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-13, -19.4, 0),
      new THREE.Vector3( 13, -19.4, 0),
    ]);
    const groundLine = new THREE.Line(groundGeo,
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.10 }));
    scene.add(groundLine);

    // Wrist trail
    const TRAIL_N = 38;
    const trailPositions = new Float32Array(TRAIL_N * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.LineDashedMaterial({
      color: 0x2563eb, dashSize: 0.3, gapSize: 0.5, transparent: true, opacity: 0.35,
    });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    scene.add(trailLine);

    // Resize handler
    const updateSize = () => {
      const w = container.clientWidth;
      const h = Math.round(w * 298 / 280) || 1;
      renderer.setSize(w, h, false);
      const aspect = w / h;
      const fh = 28;
      camera.left   = -fh * aspect / 2;
      camera.right  =  fh * aspect / 2;
      camera.top    =  7;
      camera.bottom = -21;
      camera.updateProjectionMatrix();
    };
    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    sceneRef.current = {
      renderer, scene, camera,
      accentMat, trailMat, trailPositions, trailGeo, trailLine,
      meshes: {
        headMesh, shoulderMesh, elbowMesh, wristMesh, ballMesh, gloveWristMesh,
        torsoMesh, hipMesh, pivThighMesh, pivShinMesh,
        strideThighMesh, strideShinMesh,
        gloveUpperMesh, gloveForeArmMesh, upperArmMesh, forearmMesh,
        groundLine,
      },
    };

    return () => {
      ro.disconnect();
      renderer.dispose();
      sceneRef.current = null;
    };
  }, []);

  // ── Per-frame update ─────────────────────────────────────────────────────────
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    const { renderer, scene, camera, accentMat, trailMat, trailPositions, trailGeo, trailLine, meshes } = s;
    const {
      headMesh, shoulderMesh, elbowMesh, wristMesh, ballMesh, gloveWristMesh,
      torsoMesh, hipMesh, pivThighMesh, pivShinMesh,
      strideThighMesh, strideShinMesh,
      gloveUpperMesh, gloveForeArmMesh, upperArmMesh, forearmMesh,
      groundLine,
    } = meshes;

    const isLeft = hand === "L";
    const pp = PITCHES[pitchId];
    const accentHex = parseInt(pp.accent.slice(1), 16);
    accentMat.color.setHex(accentHex);
    accentMat.emissive.setHex(accentHex);
    trailMat.color.setHex(accentHex);

    // Camera
    camera.position.copy(CAM_POSITIONS[view]);
    camera.lookAt(0, -7, 0);
    camera.up.set(0, 1, 0);

    // Ground line orientation per view
    if (view === "side") {
      groundLine.geometry.setFromPoints([
        new THREE.Vector3(0, -19.4, -13),
        new THREE.Vector3(0, -19.4,  13),
      ]);
    } else {
      groundLine.geometry.setFromPoints([
        new THREE.Vector3(-13, -19.4, 0),
        new THREE.Vector3( 13, -19.4, 0),
      ]);
    }

    // Throw arm keyframes
    let [eDx, eDy, wDx, wDy] = interpKF(ARM_KF[view], animT);
    if (isLeft) { eDx = -eDx; wDx = -wDx; }

    const modT     = ease(clamp((animT - 0.62) / 0.16, 0, 1));
    const modDecay = ease(clamp((0.82 - animT) / 0.10, 0, 1));
    const modScale = Math.min(modT, modDecay);
    const mod = WRIST_MOD[pitchId];
    const modDx = mod.dx * modScale * (isLeft ? -1 : 1);
    const modDy = mod.dy * modScale;

    // Shoulder position in 3D
    const sPos = view === "side"
      ? new THREE.Vector3(0, 0, 0)
      : new THREE.Vector3((SHOULDER_X[view][hand] - 140) / 10, 0, 0);

    const elbowPos = sPos.clone().add(offsetTo3D(view, eDx, eDy));
    const wristPos = sPos.clone().add(offsetTo3D(view, wDx + modDx, wDy + modDy));

    // Body positions
    const headPos  = new THREE.Vector3(0,  4.6, 0);
    const neckPos  = new THREE.Vector3(0,  1.0, 0);
    const hipPos   = new THREE.Vector3(0, -7.5, 0);
    const piv      = isLeft ? 1 : -1;
    const str      = -piv;

    // Hip laterals
    const hipPivPos  = new THREE.Vector3(piv * 2.2, -7.5, 0);
    const hipStrPos  = new THREE.Vector3(str * 2.2, -7.5, 0);

    // Legs
    const strideP = ease(clamp((animT - 0.10) / 0.42, 0, 1));

    let pivKneePos, pivFootPos, strideKneePos, strideFootPos;
    if (view === "side") {
      const pivZ = piv * 1.0;
      pivKneePos    = new THREE.Vector3(0, -13.6, pivZ * 1.4);
      pivFootPos    = new THREE.Vector3(0, -19.4, pivZ * 1.0);
      const sKZ     = lerp(str * 0.8, str * 5.8, strideP);
      const sKkneeZ = lerp(str * 0.8, str * 3.6, strideP);
      strideKneePos = new THREE.Vector3(0, lerp(-13.6, -10.6, strideP), sKkneeZ);
      strideFootPos = new THREE.Vector3(0, -19.4, sKZ);
    } else {
      pivKneePos    = new THREE.Vector3(piv * 1.7, -13.6, 0);
      pivFootPos    = new THREE.Vector3(piv * 2.0, -19.4, 0);
      const sklX    = lerp(str * 1.3, str * 0.3, strideP);
      strideKneePos = new THREE.Vector3(sklX, lerp(-13.6, -10.6, strideP), 0);
      strideFootPos = new THREE.Vector3(str * 0.7, -19.4, 0);
    }

    // Glove arm
    const sx_svg   = SHOULDER_X[view][hand];
    const gsx_svg  = 280 - sx_svg;
    const gloveRaise = ease(clamp(
      animT < 0.38 ? animT / 0.38 :
      animT < 0.68 ? 1 - (animT - 0.38) / 0.30 : 0,
      0, 1
    ));

    let gShoulderPos, gElbowPos, gWristPos;
    if (view === "side") {
      const fwd = isLeft ? 1 : -1;
      gShoulderPos = new THREE.Vector3(0, 0, 0);
      gElbowPos    = new THREE.Vector3(0, lerp(-3.8, -0.8, gloveRaise), lerp(fwd * 1.2, fwd * 3.0, gloveRaise));
      gWristPos    = new THREE.Vector3(0, lerp(-7.0, -2.0, gloveRaise), lerp(fwd * 2.2, fwd * 5.0, gloveRaise));
    } else {
      const inDir  = gsx_svg < 140 ? 1 : -1;
      gShoulderPos = new THREE.Vector3((gsx_svg - 140) / 10, 0, 0);
      gElbowPos    = new THREE.Vector3(
        gShoulderPos.x + inDir * lerp(2.0, 1.2, gloveRaise),
        lerp(-3.8, -0.6, gloveRaise), 0
      );
      gWristPos    = new THREE.Vector3(
        gShoulderPos.x + inDir * lerp(1.6, 0.8, gloveRaise),
        lerp(-7.0, -1.4, gloveRaise), 0
      );
    }

    // Apply positions
    headMesh.position.copy(headPos);
    updateLimb(torsoMesh, neckPos, hipPos);
    updateLimb(hipMesh, hipPivPos, hipStrPos);
    updateLimb(pivThighMesh, hipPivPos, pivKneePos);
    updateLimb(pivShinMesh,  pivKneePos, pivFootPos);
    updateLimb(strideThighMesh, hipStrPos, strideKneePos);
    updateLimb(strideShinMesh,  strideKneePos, strideFootPos);
    updateLimb(gloveUpperMesh,   gShoulderPos, gElbowPos);
    updateLimb(gloveForeArmMesh, gElbowPos,    gWristPos);
    gloveWristMesh.position.copy(gWristPos);
    shoulderMesh.position.copy(sPos);
    elbowMesh.position.copy(elbowPos);
    wristMesh.position.copy(wristPos);
    updateLimb(upperArmMesh, sPos,     elbowPos);
    updateLimb(forearmMesh,  elbowPos, wristPos);
    ballMesh.position.copy(wristPos);

    // Wrist trail
    const TRAIL_N = 38;
    const sPosTrail = view === "side"
      ? new THREE.Vector3(0, 0, 0)
      : new THREE.Vector3((SHOULDER_X[view][hand] - 140) / 10, 0, 0);
    for (let i = 0; i < TRAIL_N; i++) {
      const tt = i / (TRAIL_N - 1);
      let [,, wdx, wdy] = interpKF(ARM_KF[view], tt);
      if (isLeft) wdx = -wdx;
      const wMod = WRIST_MOD[pitchId];
      const mT2  = ease(clamp((tt - 0.62) / 0.16, 0, 1));
      const mD2  = ease(clamp((0.82 - tt) / 0.10, 0, 1));
      const mS2  = Math.min(mT2, mD2);
      const off  = offsetTo3D(view, wdx + wMod.dx * mS2 * (isLeft ? -1 : 1), wdy + wMod.dy * mS2);
      const pos  = sPosTrail.clone().add(off);
      trailPositions[i * 3]     = pos.x;
      trailPositions[i * 3 + 1] = pos.y;
      trailPositions[i * 3 + 2] = pos.z;
    }
    trailGeo.attributes.position.needsUpdate = true;
    trailLine.computeLineDistances();

    renderer.render(scene, camera);
  }, [animT, view, hand, pitchId]);

  const phase = PHASES.find(([s, e]) => animT >= s && animT < e)?.[2] ?? "Set Position";

  return (
    <div>
      <div style={{
        textAlign: "center", height: 20, marginBottom: 4,
        fontFamily: "ui-monospace, monospace",
        fontSize: 10, letterSpacing: "0.15em",
        color: p.accent, fontWeight: 700,
      }}>{phase.toUpperCase()}</div>

      <div ref={containerRef} style={{ position: "relative", width: "100%", maxWidth: 300, margin: "0 auto" }}>
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "auto" }} />
        <div style={{
          position: "absolute", bottom: 8, left: 0, right: 0,
          textAlign: "center",
          fontFamily: "ui-monospace, monospace",
          fontSize: 7.5, letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.18)",
          pointerEvents: "none",
        }}>
          {view === "front"
            ? "← FACING PITCHER →"
            : view === "side"
            ? "← BACK  ·  ARM SIDE  ·  PLATE →"
            : "← FACING HOME PLATE →"}
        </div>
      </div>
    </div>
  );
}

// ─── BALL SPIN VIZ ────────────────────────────────────────────────────────────
function BallSpinViz({ pitchId, playing, speed }) {
  const p = PITCHES[pitchId];
  const baseDur = 1.8 / speed;
  const cfgs = {
    0: { anim: "sp-cw",   dur: baseDur,          gyro: false },
    1: { anim: "sp-ccw",  dur: baseDur,          gyro: false },
    2: { anim: "sp-cw",   dur: baseDur * 1.65,   gyro: false },
    3: { anim: "sp-cw",   dur: baseDur,          gyro: true  },
  };
  const cfg = cfgs[pitchId];
  const animStyle = {
    transformBox: "fill-box",
    transformOrigin: "center center",
    animation: `${cfg.anim} ${cfg.dur}s linear infinite`,
    animationPlayState: playing ? "running" : "paused",
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontFamily: "ui-monospace, monospace",
        fontSize: 10, letterSpacing: "0.12em",
        color: p.accent, marginBottom: 10,
      }}>
        {p.spinType} · {p.spinHz}
      </div>

      <svg viewBox="0 0 130 155" width={130} height={155}
        style={{ display: "block", margin: "0 auto" }}>
        <defs>
          <radialGradient id="bgball" cx="35%" cy="32%" r="60%">
            <stop offset="0%" stopColor="#f5e6d0" />
            <stop offset="100%" stopColor="#c9a96e" />
          </radialGradient>
          <clipPath id="ballclip">
            <circle cx="65" cy="65" r="52" />
          </clipPath>
        </defs>

        <circle cx="65" cy="65" r="52" fill="url(#bgball)" />

        {cfg.gyro ? (
          <g key={pitchId} clipPath="url(#ballclip)" style={animStyle}>
            <ellipse cx="65" cy="65" rx="50" ry="13"
              fill="none" stroke="#c0392b" strokeWidth="2.8"
              transform="rotate(-44 65 65)" />
            <ellipse cx="65" cy="65" rx="50" ry="13"
              fill="none" stroke="#c0392b" strokeWidth="1.8" opacity="0.38"
              transform="rotate(44 65 65)" />
          </g>
        ) : (
          <g key={pitchId} clipPath="url(#ballclip)" style={animStyle}>
            <path d="M65,13 C100,19 117,47 117,65 C117,83 100,111 65,117 C30,111 13,83 13,65 C13,47 30,19 65,13"
              fill="none" stroke="#c0392b" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M65,13 C30,19 13,47 13,65 C13,83 30,111 65,117 C100,111 117,83 117,65 C117,47 100,19 65,13"
              fill="none" stroke="#c0392b" strokeWidth="2.8" strokeLinecap="round" />
          </g>
        )}

        <ellipse cx="50" cy="50" rx="12" ry="8"
          fill="rgba(255,255,255,0.22)" transform="rotate(-20 50 50)" />

        {cfg.gyro ? (
          <>
            <line x1="20" y1="95" x2="110" y2="35"
              stroke={p.accent} strokeWidth="1.5" strokeDasharray="4 2" opacity={0.6} />
            <text x="65" y="142" textAnchor="middle" fontSize="8.5"
              fill={p.accent} fontFamily="ui-monospace, monospace">spiral · ~45° axis</text>
          </>
        ) : (
          <>
            <line x1="12" y1="65" x2="118" y2="65"
              stroke={p.accent} strokeWidth="1.5" strokeDasharray="4 2" opacity={0.6} />
            <text x="65" y="142" textAnchor="middle" fontSize="8.5"
              fill={p.accent} fontFamily="ui-monospace, monospace">
              {pitchId === 1 ? "↺ topspin" : "↻ backspin"}
            </text>
          </>
        )}
      </svg>

      <p style={{
        fontSize: 10, color: "rgba(240,238,233,0.45)",
        textAlign: "center", margin: "8px auto 0",
        maxWidth: 215, lineHeight: 1.5,
        fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em",
      }}>{p.spinAxis}</p>
    </div>
  );
}

// ─── WRIST ANIMATION ──────────────────────────────────────────────────────────
function WristAnim({ pitchId, animT }) {
  const p = PITCHES[pitchId];
  const ws = WRIST_STATES[pitchId];

  let wristAngle;
  if      (animT < 0.30) wristAngle = 0;
  else if (animT < 0.58) wristAngle = lerp(0,       ws.load,    ease((animT - 0.30) / 0.28));
  else if (animT < 0.76) wristAngle = lerp(ws.load, ws.release, ease((animT - 0.58) / 0.18));
  else if (animT < 0.92) wristAngle = lerp(ws.release, 0,       ease((animT - 0.76) / 0.16));
  else                   wristAngle = 0;

  const wristPhaseLabel =
    animT < 0.30 ? "NEUTRAL" :
    animT < 0.58 ? ws.loadLabel :
    animT < 0.76 ? ws.releaseLabel :
    "RECOVERY";

  const wx = 92, wy = 88;
  const handLen = 55;
  const rad = (wristAngle * Math.PI) / 180;
  const handEndX = wx + handLen * Math.cos(rad);
  const handEndY = wy + handLen * Math.sin(rad);

  return (
    <div>
      <div style={{
        fontFamily: "ui-monospace, monospace",
        fontSize: 10, letterSpacing: "0.12em",
        color: p.accent, textAlign: "center", marginBottom: 8,
      }}>WRIST ACTION AT RELEASE</div>

      <svg viewBox="0 0 200 178" width="100%"
        style={{ maxWidth: 220, display: "block", margin: "0 auto" }}>

        <line x1="8" y1={wy} x2={wx} y2={wy}
          stroke="rgba(240,238,233,0.52)" strokeWidth="14" strokeLinecap="round" />

        <circle cx={wx} cy={wy} r={10} fill="rgba(240,238,233,0.80)" />
        <circle cx={wx} cy={wy} r={6}  fill={p.accent} opacity={0.75} />

        <line x1={wx} y1={wy} x2={wx + 58} y2={wy}
          stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" strokeDasharray="4 3" />

        <line x1={wx} y1={wy} x2={handEndX} y2={handEndY}
          stroke={p.accent} strokeWidth="12" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${p.accent}99)` }} />

        {[-18, 0, 18].map((offset, i) => {
          const fRad = rad + (offset * Math.PI) / 180;
          const fLen = 22;
          return (
            <line key={i}
              x1={handEndX} y1={handEndY}
              x2={handEndX + fLen * Math.cos(fRad)}
              y2={handEndY + fLen * Math.sin(fRad)}
              stroke={p.accent} strokeWidth="4" strokeLinecap="round" opacity={0.85} />
          );
        })}

        <circle cx={handEndX} cy={handEndY} r={11} fill="#f5e6d0" opacity={0.92} />

        {Math.abs(wristAngle) > 6 && (
          <path
            d={`M${wx + 32},${wy} A32,32 0 0,${wristAngle > 0 ? 1 : 0} ${wx + 32 * Math.cos(rad)},${wy + 32 * Math.sin(rad)}`}
            fill="none" stroke={p.accent}
            strokeWidth="1.5" strokeDasharray="3 2" opacity={0.55}
          />
        )}

        <text x={wx} y={wy + 50} textAnchor="middle"
          fontSize="9" fill={p.accent}
          fontFamily="ui-monospace, monospace" letterSpacing="0.1em">
          {wristPhaseLabel}
        </text>
        <text x={wx} y={wy + 64} textAnchor="middle"
          fontSize="8" fill="rgba(240,238,233,0.32)"
          fontFamily="ui-monospace, monospace">
          {Math.abs(wristAngle) < 3 ? "0°"
            : `${wristAngle > 0 ? "+" : ""}${Math.round(wristAngle)}°`}
        </text>
      </svg>

      <p style={{
        fontSize: 10, color: "rgba(240,238,233,0.50)",
        textAlign: "center", margin: "4px auto 0",
        maxWidth: 210, lineHeight: 1.5,
        fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em",
      }}>{p.releaseLabel}</p>
    </div>
  );
}

// ─── DRILLS SECTION ───────────────────────────────────────────────────────────
function DrillCard({ item, accent, index }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${accent}28`,
      borderRadius: 10, padding: "14px 16px",
    }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "baseline" }}>
        <span style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 9, color: accent,
          letterSpacing: "0.10em", fontWeight: 700,
        }}>#{index + 1}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#F0EEE9" }}>{item.title}</span>
      </div>
      <p style={{ margin: 0, fontSize: 11, color: "rgba(240,238,233,0.60)", lineHeight: 1.55 }}>
        {item.desc}
      </p>
    </div>
  );
}

function DrillsSection({ pitchId }) {
  const p     = PITCHES[pitchId];
  const drill = DRILLS[pitchId];
  const [group, setGroup] = useState("passive");

  const groupMeta = [
    { key: "passive",  emoji: "🪑", label: "PASSIVE DRILLS",
      sub: "Do these anywhere — watching a game, in class, at a desk. Just a ball." },
    { key: "active",   emoji: "⚾", label: "ACTIVE DRILLS",
      sub: "On-field, at a net, or in a bullpen. Build mechanics before adding velocity." },
    { key: "strength", emoji: "💪", label: "STRENGTH & CONDITIONING",
      sub: "Progressive overload, not max effort. Pitcher longevity first." },
  ];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{
          margin: "0 0 10px",
          fontFamily: "ui-monospace, monospace",
          fontSize: 9, letterSpacing: "0.18em",
          color: "rgba(240,238,233,0.28)",
        }}>MASTERY PROGRESSION PATH</p>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          {PITCHES.map((pp, i) => (
            <div key={pp.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                padding: "5px 13px", borderRadius: 7,
                background: pp.id === pitchId ? pp.accent : "rgba(255,255,255,0.05)",
                border: `1px solid ${pp.id <= pitchId ? pp.accent + "66" : "rgba(255,255,255,0.10)"}`,
                fontFamily: "ui-monospace, monospace",
                fontSize: 10, letterSpacing: "0.08em",
                color: pp.id === pitchId ? "#0E1117"
                     : pp.id < pitchId ? pp.accent
                     : "rgba(255,255,255,0.30)",
                fontWeight: pp.id === pitchId ? 800 : 400,
              }}>
                {pp.order}. {pp.short}
              </div>
              {i < PITCHES.length - 1 && (
                <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 14 }}>→</span>
              )}
            </div>
          ))}
        </div>
        {p.prereqLabel && (
          <p style={{
            margin: "10px 0 0",
            fontFamily: "ui-monospace, monospace",
            fontSize: 10, letterSpacing: "0.05em",
            color: `${p.accent}CC`, lineHeight: 1.5,
          }}>⚠ {p.prereqLabel}</p>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {groupMeta.map(({ key, emoji, label }) => (
          <button key={key} onClick={() => setGroup(key)}
            style={{
              padding: "7px 13px", cursor: "pointer",
              background: group === key ? `${p.accent}22` : "transparent",
              border: `1px solid ${group === key ? p.accent : "rgba(255,255,255,0.12)"}`,
              borderRadius: 7,
              color: group === key ? p.accent : "rgba(255,255,255,0.45)",
              fontFamily: "ui-monospace, monospace",
              fontSize: 9, letterSpacing: "0.10em",
              transition: "all 0.15s",
            }}>
            {emoji} {label}
          </button>
        ))}
      </div>

      <p style={{
        margin: "0 0 14px",
        fontFamily: "ui-monospace, monospace",
        fontSize: 10, color: "rgba(240,238,233,0.36)",
        letterSpacing: "0.05em", lineHeight: 1.5,
      }}>
        {groupMeta.find(g => g.key === group)?.sub}
      </p>

      {(group === "passive" || group === "active") && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(275px, 1fr))", gap: 12 }}>
          {drill[group].map((d, i) => (
            <DrillCard key={i} item={d} accent={p.accent} index={i} />
          ))}
        </div>
      )}

      {group === "strength" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {drill.strength.map((grp, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${p.accent}28`,
              borderRadius: 10, padding: "14px 16px",
            }}>
              <p style={{
                margin: "0 0 9px",
                fontFamily: "ui-monospace, monospace",
                fontSize: 9, color: p.accent,
                letterSpacing: "0.12em", fontWeight: 700,
              }}>{grp.group.toUpperCase()}</p>
              {grp.exercises.map((ex, j) => (
                <div key={j} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "flex-start" }}>
                  <span style={{ color: p.accent, flexShrink: 0, marginTop: 1 }}>›</span>
                  <span style={{ fontSize: 11, color: "rgba(240,238,233,0.65)", lineHeight: 1.45 }}>
                    {ex}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PITCH LIBRARY — GRIP SVGs ────────────────────────────────────────────────
const LEGEND = [
  { color: "#2563EB", label: "Index" },
  { color: "#059669", label: "Middle" },
  { color: "#7C3AED", label: "Ring" },
  { color: "#DC2626", label: "Thumb" },
];

function Baseball({ children, accent }) {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" style={{ display: "block" }}>
      <defs>
        <radialGradient id={`bg-${accent}`} cx="38%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#f5e6d0" />
          <stop offset="100%" stopColor="#c9a96e" />
        </radialGradient>
        <radialGradient id="seam-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill={`url(#bg-${accent})`} />
      <circle cx="60" cy="60" r="54" fill="url(#seam-shadow)" />
      <ellipse cx="44" cy="38" rx="12" ry="8" fill="rgba(255,255,255,0.22)" transform="rotate(-20 44 38)" />
      {children}
    </svg>
  );
}

function Seam({ d }) {
  return (
    <path d={d} fill="none" stroke="#c0392b" strokeWidth="2.2"
      strokeLinecap="round"
      style={{ filter: "drop-shadow(0 0 1px rgba(180,30,20,0.4))" }} />
  );
}

function Finger({ cx, cy, rx, ry, color, rotation = 0 }) {
  const id = `f-${color.replace("#","")}-${cx}-${cy}`;
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
        fill={`url(#${id})`}
        stroke="rgba(0,0,0,0.35)" strokeWidth="1"
        transform={rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined}
      />
      <ellipse cx={cx} cy={cy - ry * 0.3} rx={rx * 0.5} ry={ry * 0.18}
        fill="rgba(255,255,255,0.25)"
        transform={rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined}
      />
    </g>
  );
}

function FourSeamGrip() {
  return (
    <Baseball accent="blue">
      <Seam d="M 30 52 Q 35 18 60 14 Q 85 18 90 52" />
      <Seam d="M 30 68 Q 35 102 60 106 Q 85 102 90 68" />
      <Finger cx="48" cy="10" rx="7" ry="14" color="#2563EB" />
      <Finger cx="72" cy="10" rx="7" ry="14" color="#059669" />
      <Finger cx="32" cy="82" rx="14" ry="7" color="#DC2626" rotation={15} />
    </Baseball>
  );
}

function CurveballGrip() {
  return (
    <Baseball accent="purple">
      <Seam d="M 25 30 Q 15 60 25 90" />
      <Seam d="M 95 30 Q 105 60 95 90" />
      <Finger cx="100" cy="58" rx="13" ry="7" color="#059669" rotation={-5} />
      <Finger cx="86" cy="46" rx="7" ry="13" color="#2563EB" rotation={10} />
      <Finger cx="28" cy="72" rx="13" ry="7" color="#DC2626" rotation={-10} />
    </Baseball>
  );
}

function ChangeupGrip() {
  return (
    <Baseball accent="orange">
      <Seam d="M 30 52 Q 35 18 60 14 Q 85 18 90 52" />
      <Seam d="M 30 68 Q 35 102 60 106 Q 85 102 90 68" />
      <circle cx="28" cy="60" r="16" fill="none"
        stroke="#DC2626" strokeWidth="2.5" strokeDasharray="4 2" opacity="0.7" />
      <Finger cx="20" cy="52" rx="6" ry="11" color="#DC2626" rotation={-30} />
      <Finger cx="36" cy="46" rx="6" ry="11" color="#2563EB" rotation={30} />
      <Finger cx="55" cy="9" rx="6" ry="13" color="#059669" />
      <Finger cx="70" cy="10" rx="6" ry="13" color="#7C3AED" />
      <Finger cx="84" cy="14" rx="5" ry="11" color="#D97706" rotation={-10} />
    </Baseball>
  );
}

function SliderGrip() {
  return (
    <Baseball accent="red">
      <Seam d="M 30 52 Q 35 18 60 14 Q 85 18 90 52" />
      <Seam d="M 30 68 Q 35 102 60 106 Q 85 102 90 68" />
      <Finger cx="82" cy="9" rx="7" ry="14" color="#2563EB" rotation={5} />
      <Finger cx="96" cy="22" rx="7" ry="14" color="#059669" rotation={25} />
      <Finger cx="28" cy="80" rx="14" ry="7" color="#DC2626" rotation={10} />
    </Baseball>
  );
}

const GRIP_COMPONENTS = [FourSeamGrip, CurveballGrip, ChangeupGrip, SliderGrip];

function LibraryArmPath({ paths, labels, highlight }) {
  return (
    <svg viewBox="0 0 200 120" width="100%" height="80" style={{ display: "block", maxWidth: 240 }}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill="none"
          stroke={p.main ? highlight : "rgba(255,255,255,0.15)"}
          strokeWidth={p.main ? 2.5 : 1.5}
          strokeDasharray={p.dash ? "5 3" : undefined}
          strokeLinecap="round"
        />
      ))}
      {labels.map((l, i) => (
        <text key={i} x={l.x} y={l.y} fill="rgba(255,255,255,0.55)"
          fontSize="9" fontFamily="ui-monospace, monospace" textAnchor={l.anchor || "middle"}>
          {l.text}
        </text>
      ))}
      <circle cx={paths[0]?.release?.[0] || 100} cy={paths[0]?.release?.[1] || 30}
        r="4" fill={highlight} opacity="0.85" />
      <circle cx={paths[0]?.release?.[0] || 100} cy={paths[0]?.release?.[1] || 30}
        r="7" fill={highlight} opacity="0.2" />
    </svg>
  );
}

function PitchCard({ pitch, isActive }) {
  const [showDelivery, setShowDelivery] = useState(false);
  const GripComponent = GRIP_COMPONENTS[pitch.id];

  return (
    <div style={{
      background: "#13151C",
      border: `1px solid ${isActive ? pitch.accent + "88" : pitch.accent + "33"}`,
      borderRadius: 16,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      boxShadow: isActive ? `0 0 0 2px ${pitch.accent}44` : "none",
      transition: "box-shadow 0.2s",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 20% 20%, ${pitch.accent}18 0%, transparent 60%)`,
        pointerEvents: "none",
      }} />

      <div style={{ padding: "20px 20px 0", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{
            fontFamily: "ui-monospace, 'Cascadia Code', monospace",
            fontSize: 11, letterSpacing: "0.15em",
            color: pitch.accent, fontWeight: 700,
          }}>{String(pitch.order).padStart(2, "0")} / {pitch.family.toUpperCase()}</span>
          <span style={{
            background: `${pitch.accent}22`,
            border: `1px solid ${pitch.accent}44`,
            borderRadius: 6, padding: "2px 8px",
            fontSize: 10, color: pitch.accent,
            fontFamily: "ui-monospace, monospace",
          }}>{pitch.velo}</span>
        </div>
        <h2 style={{
          margin: "6px 0 4px",
          fontSize: 20, fontWeight: 800,
          color: "#F0EEE9",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}>{pitch.name}</h2>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {pitch.badges.map(b => (
            <span key={b} style={{
              fontSize: 9, letterSpacing: "0.1em",
              color: "rgba(240,238,233,0.45)",
              background: "rgba(255,255,255,0.06)",
              borderRadius: 4, padding: "2px 6px",
              fontFamily: "ui-monospace, monospace",
            }}>{b.toUpperCase()}</span>
          ))}
        </div>
      </div>

      <div style={{
        padding: "0 20px 16px",
        display: "flex", gap: 16, alignItems: "flex-start",
        position: "relative",
      }}>
        <div style={{ flexShrink: 0 }}>
          <GripComponent />
          <p style={{
            margin: "6px 0 0",
            fontSize: 8, color: "rgba(240,238,233,0.35)",
            fontFamily: "ui-monospace, monospace",
            textAlign: "center", letterSpacing: "0.08em",
          }}>GRIP VIEW</p>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 10px", fontSize: 11, color: "rgba(240,238,233,0.6)", lineHeight: 1.5 }}>
            {pitch.gripSummary}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              ["SPIN", pitch.rpm],
              ["BREAK", pitch.pitchBreak],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <span style={{
                  fontSize: 9, color: pitch.accent,
                  fontFamily: "ui-monospace, monospace",
                  letterSpacing: "0.12em", fontWeight: 700, minWidth: 36,
                }}>{k}</span>
                <span style={{
                  fontSize: 11, color: "rgba(240,238,233,0.75)",
                  fontFamily: "ui-monospace, monospace",
                }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${pitch.accent}22`, position: "relative" }}>
        <button
          onClick={() => setShowDelivery(s => !s)}
          style={{
            width: "100%", padding: "10px 20px",
            background: showDelivery ? `${pitch.accent}18` : "transparent",
            border: "none", cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            color: pitch.accent,
            fontFamily: "ui-monospace, monospace",
            fontSize: 10, letterSpacing: "0.12em", fontWeight: 700,
          }}
        >
          <span>{showDelivery ? "▲" : "▼"} DELIVERY MECHANICS</span>
          <span style={{ opacity: 0.5, fontWeight: 400 }}>{showDelivery ? "collapse" : "expand"}</span>
        </button>

        {showDelivery && (
          <div style={{ padding: "0 20px 20px", position: "relative" }}>
            <div style={{ marginBottom: 12, background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{
                margin: "0 0 6px", fontSize: 8, color: pitch.accent,
                fontFamily: "ui-monospace, monospace", letterSpacing: "0.15em",
              }}>ARM PATH DIAGRAM — PITCHER POV</p>
              <LibraryArmPath {...pitch.armPaths} highlight={pitch.accent} />
              <p style={{ margin: "6px 0 0", fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "ui-monospace, monospace" }}>
                ● = release point · - - = ball trajectory
              </p>
            </div>

            <p style={{ margin: "0 0 10px", fontSize: 11, color: "rgba(240,238,233,0.7)", lineHeight: 1.6 }}>
              {pitch.delivery.summary}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
              {pitch.delivery.mechanics.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: pitch.accent, fontSize: 12, flexShrink: 0, marginTop: 1 }}>›</span>
                  <span style={{ fontSize: 11, color: "rgba(240,238,233,0.6)", lineHeight: 1.4 }}>{m}</span>
                </div>
              ))}
            </div>

            <div style={{
              background: `${pitch.accent}12`,
              border: `1px solid ${pitch.accent}30`,
              borderRadius: 8, padding: "10px 12px",
            }}>
              <p style={{
                margin: "0 0 4px", fontSize: 9,
                color: pitch.accent, fontFamily: "ui-monospace, monospace",
                letterSpacing: "0.12em", fontWeight: 700,
              }}>WHY IT WORKS</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(240,238,233,0.65)", lineHeight: 1.5 }}>
                {pitch.delivery.whyItWorks}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PitchLibrary({ pitchId }) {
  return (
    <div>
      <div style={{ maxWidth: 860, margin: "0 auto 24px" }}>
        <p style={{
          margin: "0 0 6px",
          fontFamily: "ui-monospace, 'Cascadia Code', monospace",
          fontSize: 10, letterSpacing: "0.18em",
          color: "rgba(240,238,233,0.35)",
        }}>MAJOR LEAGUE BASEBALL / PITCH LIBRARY</p>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(240,238,233,0.45)", lineHeight: 1.5, maxWidth: 520 }}>
          Every MLB pitch descends from these four archetypes. Tap{" "}
          <strong style={{ color: "rgba(240,238,233,0.7)" }}>Delivery Mechanics</strong> on any card
          to see arm path and physics. The highlighted card matches your selected pitch above.
        </p>
        <div style={{
          display: "inline-flex", gap: 16, alignItems: "center",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, padding: "8px 14px",
        }}>
          <span style={{
            fontSize: 9, color: "rgba(240,238,233,0.35)",
            fontFamily: "ui-monospace, monospace", letterSpacing: "0.12em",
          }}>FINGER KEY</span>
          {LEGEND.map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "rgba(240,238,233,0.5)", fontFamily: "ui-monospace, monospace" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        maxWidth: 860,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: 20,
      }}>
        {PITCHES.map(p => (
          <PitchCard key={p.id} pitch={p} isActive={p.id === pitchId} />
        ))}
      </div>

      <p style={{
        textAlign: "center", marginTop: 40,
        fontSize: 10, color: "rgba(240,238,233,0.2)",
        fontFamily: "ui-monospace, monospace", letterSpacing: "0.1em",
      }}>
        GRIP ILLUSTRATIONS ARE DIAGRAMMATIC — ACTUAL GRIP PRESSURE VARIES BY PITCHER
      </p>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [pitchId,  setPitchId]  = useState(0);
  const [hand,     setHand]     = useState("R");
  const [view,     setView]     = useState("front");
  const [tab,      setTab]      = useState("arm");
  const [playing,  setPlaying]  = useState(true);
  const [speed,    setSpeed]    = useState(1);

  const animT = useAnimT(playing, speed);
  const p = PITCHES[pitchId];

  const tabStyle = (key) => ({
    padding: "9px 18px", cursor: "pointer",
    background: "transparent", border: "none",
    borderBottom: `2px solid ${tab === key ? p.accent : "transparent"}`,
    color: tab === key ? p.accent : "rgba(255,255,255,0.38)",
    fontFamily: "ui-monospace, monospace",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
    marginBottom: -1, transition: "all 0.15s",
  });

  const ctrlBtn = (active, onClick) => ({
    onClick, style: {
      padding: "6px 12px", cursor: "pointer",
      background: active ? "rgba(255,255,255,0.13)" : "transparent",
      border: `1px solid ${active ? "rgba(255,255,255,0.46)" : "rgba(255,255,255,0.12)"}`,
      borderRadius: 7,
      color: active ? "#F0EEE9" : "rgba(255,255,255,0.40)",
      fontFamily: "ui-monospace, monospace",
      fontSize: 10, letterSpacing: "0.09em",
      transition: "all 0.15s",
    },
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0E1117",
      color: "#F0EEE9",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: "24px 16px 60px",
    }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <p style={{
          margin: "0 0 4px",
          fontFamily: "ui-monospace, monospace",
          fontSize: 9, letterSpacing: "0.22em",
          color: "rgba(240,238,233,0.26)",
        }}>MLB PITCH MECHANICS TRAINER</p>
        <h1 style={{
          margin: "0 0 18px",
          fontSize: "clamp(22px,4vw,36px)",
          fontWeight: 900, letterSpacing: "-0.03em",
          background: "linear-gradient(130deg,#F0EEE9 40%,rgba(240,238,233,0.42))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Arm Motion · Spin · Drills · Library</h1>

        {/* Controls */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
          {PITCHES.map(pp => (
            <button key={pp.id}
              onClick={() => setPitchId(pp.id)}
              style={{
                padding: "6px 13px", cursor: "pointer",
                background: pitchId === pp.id ? pp.accent : "rgba(255,255,255,0.07)",
                border: `1px solid ${pitchId === pp.id ? pp.accent : "rgba(255,255,255,0.12)"}`,
                borderRadius: 7,
                color: pitchId === pp.id ? "#0E1117" : "rgba(255,255,255,0.52)",
                fontFamily: "ui-monospace, monospace",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                transition: "all 0.15s",
              }}>
              {pp.short}
            </button>
          ))}

          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.14)", margin: "0 2px" }} />

          {["R", "L"].map(h => (
            <button key={h} {...ctrlBtn(hand === h, () => setHand(h))}>
              {h}HP
            </button>
          ))}

          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.14)", margin: "0 2px" }} />

          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.26)",
            fontFamily: "ui-monospace, monospace", letterSpacing: "0.1em" }}>SPD</span>
          {[{ v: 0.4, l: "½×" }, { v: 1, l: "1×" }, { v: 2, l: "2×" }].map(({ v, l }) => (
            <button key={v} {...ctrlBtn(speed === v, () => setSpeed(v))}
              style={{ ...ctrlBtn(speed === v, () => setSpeed(v)).style, padding: "4px 8px", fontSize: 9 }}>
              {l}
            </button>
          ))}

          <button
            onClick={() => setPlaying(pl => !pl)}
            style={{
              padding: "6px 13px", cursor: "pointer",
              background: `${p.accent}20`,
              border: `1px solid ${p.accent}55`,
              borderRadius: 7, color: p.accent,
              fontFamily: "ui-monospace, monospace",
              fontSize: 10, letterSpacing: "0.08em",
            }}>
            {playing ? "⏸ PAUSE" : "▶ PLAY"}
          </button>
        </div>

        {/* Pitch name */}
        <h2 style={{
          margin: "10px 0 18px",
          fontSize: 20, fontWeight: 800,
          color: p.accent, letterSpacing: "-0.02em",
        }}>
          {p.order}. {p.name}
        </h2>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 0,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          marginBottom: 22,
        }}>
          <button style={tabStyle("arm")}     onClick={() => setTab("arm")}>ARM MOTION</button>
          <button style={tabStyle("ball")}    onClick={() => setTab("ball")}>BALL & SPIN</button>
          <button style={tabStyle("drills")}  onClick={() => setTab("drills")}>DRILLS & MASTERY</button>
          <button style={tabStyle("library")} onClick={() => setTab("library")}>PITCH LIBRARY</button>
        </div>

        {/* ARM MOTION */}
        {tab === "arm" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18, justifyContent: "center", flexWrap: "wrap" }}>
              {[
                { key: "front", label: "← FACING PITCHER →" },
                { key: "side",  label: "← ARM SIDE →" },
                { key: "back",  label: "← BEHIND PITCHER →" },
              ].map(({ key, label }) => (
                <button key={key}
                  onClick={() => setView(key)}
                  style={{
                    padding: "6px 14px", cursor: "pointer",
                    background: view === key ? `${p.accent}20` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${view === key ? p.accent : "rgba(255,255,255,0.10)"}`,
                    borderRadius: 7,
                    color: view === key ? p.accent : "rgba(255,255,255,0.38)",
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 9, letterSpacing: "0.10em",
                  }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{
              background: "#13151C",
              border: `1px solid ${p.accent}28`,
              borderRadius: 14, padding: "22px 16px 16px",
            }}>
              <PitcherFigure pitchId={pitchId} view={view} hand={hand} animT={animT} />
              <div style={{
                marginTop: 14, padding: "10px 14px",
                background: "rgba(0,0,0,0.30)", borderRadius: 8,
                textAlign: "center",
              }}>
                <span style={{
                  display: "block", marginBottom: 3,
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 8, letterSpacing: "0.15em", color: p.accent,
                }}>RELEASE MECHANICS</span>
                <span style={{ fontSize: 11, color: "rgba(240,238,233,0.55)", lineHeight: 1.5 }}>
                  {p.releaseLabel}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* BALL & SPIN */}
        {tab === "ball" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 18,
          }}>
            <div style={{
              background: "#13151C",
              border: `1px solid ${p.accent}28`,
              borderRadius: 14, padding: "22px 16px",
            }}>
              <BallSpinViz pitchId={pitchId} playing={playing} speed={speed} />
            </div>
            <div style={{
              background: "#13151C",
              border: `1px solid ${p.accent}28`,
              borderRadius: 14, padding: "22px 16px",
            }}>
              <WristAnim pitchId={pitchId} animT={animT} />
            </div>
          </div>
        )}

        {/* DRILLS & MASTERY */}
        {tab === "drills" && (
          <DrillsSection pitchId={pitchId} />
        )}

        {/* PITCH LIBRARY */}
        {tab === "library" && (
          <PitchLibrary pitchId={pitchId} />
        )}

      </div>
    </div>
  );
}
