const { useEffect, useRef, useState } = React;

// Cross-browser rounded-rect helper
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.stroke();
}

function makePointsForShape(kind, width, height, isMobile) {
  const sz = Math.floor(Math.min(width * 0.52, height * 0.52, 520));
  const off = document.createElement("canvas");
  off.width = sz; off.height = sz;
  const ctx = off.getContext("2d");
  ctx.clearRect(0, 0, sz, sz);

  ctx.strokeStyle = "#fff";
  ctx.fillStyle   = "#fff";
  ctx.lineWidth   = Math.max(6, sz * 0.024);
  ctx.lineJoin    = "round";
  ctx.lineCap     = "round";

  const cx = sz / 2, cy = sz / 2;

  if (kind === "globe") {
    const r = sz * 0.38;
    // Outer sphere
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    // Equator (flat ellipse)
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.2, 0, 0, Math.PI * 2); ctx.stroke();
    // North latitude
    ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.55, r * 0.84, r * 0.26, 0, 0, Math.PI * 2); ctx.stroke();
    // South latitude
    ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.55, r * 0.84, r * 0.26, 0, 0, Math.PI * 2); ctx.stroke();
    // Central meridian (vertical ellipse)
    ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.44, r, 0, 0, Math.PI * 2); ctx.stroke();
    // Second meridian
    ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.80, r, 0, 0, Math.PI * 2); ctx.stroke();

  } else if (kind === "face") {
    const r = sz * 0.38;
    // Head circle
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    // Left eye
    ctx.beginPath(); ctx.arc(cx - r * 0.33, cy - r * 0.20, r * 0.10, 0, Math.PI * 2); ctx.fill();
    // Right eye
    ctx.beginPath(); ctx.arc(cx + r * 0.33, cy - r * 0.20, r * 0.10, 0, Math.PI * 2); ctx.fill();
    // Smile arc
    ctx.beginPath(); ctx.arc(cx, cy + r * 0.08, r * 0.52, 0.18 * Math.PI, 0.82 * Math.PI); ctx.stroke();

  } else if (kind === "mac") {
    // Screen
    const sw = sz * 0.76, sh = sz * 0.46;
    const sx = (sz - sw) / 2, sy = sz * 0.07;
    roundRect(ctx, sx, sy, sw, sh, sz * 0.04);
    // Hinge line
    ctx.beginPath();
    ctx.moveTo(sx + sw * 0.15, sy + sh);
    ctx.lineTo(sx + sw * 0.85, sy + sh);
    ctx.stroke();
    // Base / keyboard
    const bw = sz * 0.88, bh = sz * 0.09;
    const bx = (sz - bw) / 2, by = sy + sh + sz * 0.04;
    roundRect(ctx, bx, by, bw, bh, bh * 0.4);
    // Trackpad
    const tw = sz * 0.26, th = sz * 0.05;
    roundRect(ctx, (sz - tw) / 2, by + (bh - th) / 2, tw, th, th * 0.3);

  } else if (kind === "pencil") {
    const len = sz * 0.72, thick = sz * 0.13;
    const bs = -len * 0.44, be = len * 0.24;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 4);
    // Body rectangle
    ctx.strokeRect(bs, -thick / 2, be - bs, thick);
    // Pointed tip
    ctx.beginPath();
    ctx.moveTo(be, -thick / 2);
    ctx.lineTo(be + thick * 0.85, 0);
    ctx.lineTo(be, thick / 2);
    ctx.closePath(); ctx.stroke();
    // Eraser band
    ctx.beginPath();
    ctx.moveTo(bs + len * 0.15, -thick / 2);
    ctx.lineTo(bs + len * 0.15,  thick / 2);
    ctx.stroke();
    ctx.restore();
  }

  const data = ctx.getImageData(0, 0, sz, sz).data;
  const points = [];
  const step = isMobile ? 6 : 4;
  const offX = (width - sz) / 2;
  const offY = height * 0.06; // shapes live in the upper portion

  for (let y = 0; y < sz; y += step) {
    for (let x = 0; x < sz; x += step) {
      if (data[(y * sz + x) * 4 + 3] > 20) {
        points.push({ x: x + offX, y: y + offY });
      }
    }
  }
  return points;
}

// ── Language sets ─────────────────────────────────────────────────────────────
const LANG_SETS = [
  ["Art",          "Technology",      "Marketing"      ], // English
  ["Arte",         "Tecnolog\u00eda", "Marketing"      ], // Spanish
  ["\u827a\u672f", "\u6280\u672f",    "\u8425\u9500"   ], // Chinese
  ["\u82b8\u8853", "\u30c6\u30af\u30ce\u30ed\u30b8\u30fc", "\u30de\u30fc\u30b1\u30c6\u30a3\u30f3\u30b0"], // Japanese
  ["Kunst",        "Technologie",     "Marketing"      ], // German
  ["\u0641\u0646", "\u062a\u0643\u0646\u0648\u0644\u0648\u062c\u064a\u0627", "\u062a\u0633\u0648\u064a\u0642"], // Arabic
  ["\u041c\u0438\u0441\u0442\u0435\u0446\u0442\u0432\u043e", "\u0422\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0456\u044f", "\u041c\u0430\u0440\u043a\u0435\u0442\u0438\u043d\u0433"], // Ukrainian
];

function fmt(set) { return set[0] + ". " + set[1] + ". " + set[2] + "."; }

function useTagline() {
  const base = fmt(LANG_SETS[0]);
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(-1);

  // Typewriter
  useEffect(() => {
    if (idx !== -1) return;
    if (text.length < base.length) {
      const id = setTimeout(() => setText(base.slice(0, text.length + 1)), 60);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setIdx(1), 1800);
    return () => clearTimeout(id);
  }, [idx, text]);

  // Language cycling (infinite loop)
  useEffect(() => {
    if (idx < 0) return;
    setText(fmt(LANG_SETS[idx % LANG_SETS.length]));
    const id = setTimeout(() => setIdx(idx + 1), 2400);
    return () => clearTimeout(id);
  }, [idx]);

  return { text: text || "\u00a0", isTyping: idx === -1 && text.length < base.length };
}

// ── App ───────────────────────────────────────────────────────────────────────
const SHAPES = ["globe", "face", "mac", "pencil"];

function App() {
  const canvasRef = useRef(null);
  const { text: tagline, isTyping } = useTagline();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = window.innerWidth, height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let isMobile = width <= 768;
    let shapeIndex = 0;

    const particleCount = isMobile ? 700 : 1300;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: 0, vy: 0, tx: width / 2, ty: height / 2,
    }));

    const assignTargets = () => {
      const targets = makePointsForShape(SHAPES[shapeIndex], width, height, isMobile);
      for (let i = 0; i < particles.length; i++) {
        const t = targets[i % targets.length];
        particles[i].tx = t.x; particles[i].ty = t.y;
      }
    };

    const mouse = { x: -9999, y: -9999, active: false };

    const setSize = () => {
      width = window.innerWidth; height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      isMobile = width <= 768;
      canvas.width  = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width  = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      assignTargets();
    };

    setSize();

    const onMove  = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; };
    const onTouch = () => { mouse.active = false; };
    const onLeave = () => { mouse.active = false; };
    window.addEventListener("resize", setSize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    const shapeTimer = setInterval(() => {
      shapeIndex = (shapeIndex + 1) % SHAPES.length;
      assignTargets();
    }, isMobile ? 3800 : 3400);

    let raf = null;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(185, 70, 255, 0.92)";

      // Text sits at the bottom ~87% down — push particles away from it
      const textCY  = height * 0.87;
      const safW    = isMobile ? 220 : 380;
      const safH    = isMobile ? 55 : 70;
      const halfW   = width * 0.5;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.vx += (p.tx - p.x) * 0.008;
        p.vy += (p.ty - p.y) * 0.008;

        if (mouse.active && !isMobile) {
          const mx = p.x - mouse.x, my = p.y - mouse.y;
          const d2 = mx * mx + my * my, R = 110;
          if (d2 < R * R) {
            const push = (R * R - d2) / (R * R);
            const a = Math.atan2(my, mx);
            p.vx += Math.cos(a) * push * 1.2;
            p.vy += Math.sin(a) * push * 1.2;
          }
        }

        // Keep particles out of the text zone
        if (Math.abs(p.x - halfW) < safW && Math.abs(p.y - textCY) < safH) {
          p.vx += (p.x >= halfW ? 0.7 : -0.7);
          p.vy -= 0.6; // push upward toward shape
        }

        p.vx *= 0.84; p.vy *= 0.84;
        p.x += p.vx;  p.y += p.vy;
        ctx.fillRect(p.x, p.y, isMobile ? 1.8 : 2.2, isMobile ? 1.8 : 2.2);
      }

      raf = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(shapeTimer);
      window.removeEventListener("resize", setSize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return React.createElement(
    "div", { className: "site" },
    React.createElement("canvas", { ref: canvasRef, "aria-hidden": "true" }),
    React.createElement(
      "nav", { className: "nav", "aria-label": "Main" },
      React.createElement("a", { href: "https://marketingos.blog", target: "_blank", rel: "noreferrer" }, "Blog"),
      React.createElement("a", { href: "/about/" }, "About")
    ),
    React.createElement(
      "main", { className: "centerpiece" },
      React.createElement(
        "div", { className: "center-card" },
        React.createElement("h1", null, "Fangzhi Zhao"),
        React.createElement("p", { className: isTyping ? "tagline typing" : "tagline" }, tagline)
      )
    ),
    React.createElement("footer", { className: "footer" }, "\u00a9 2016\u20132026 Fangzhi Zhao")
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
