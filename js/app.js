const { useEffect, useRef, useState } = React;

function makePointsForShape(kind, width, height, isMobile) {
  const off = document.createElement("canvas");
  const w = Math.floor(Math.min(width * 0.74, 740));
  const h = Math.floor(Math.min(height * 0.58, 480));
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d");

  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  ctx.lineWidth = Math.max(5, Math.min(w, h) * 0.033);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (kind === "globe") {
    const r = Math.min(w, h) * 0.35;
    const cx = w * 0.5;
    const cy = h * 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    for (const ratio of [0.45, 0.75]) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * ratio, r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const yf of [-0.45, 0, 0.45]) {
      const ry = r * Math.cos(Math.asin(Math.min(0.95, Math.abs(yf))));
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * yf, r, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (kind === "face") {
    const r = Math.min(w, h) * 0.34;
    const cx = w * 0.5;
    const cy = h * 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    const eyeR = r * 0.1;
    ctx.beginPath();
    ctx.arc(cx - r * 0.36, cy - r * 0.18, eyeR, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.36, cy - r * 0.18, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.1, r * 0.48, 0.18 * Math.PI, 0.82 * Math.PI, false);
    ctx.stroke();
  } else if (kind === "mac") {
    const x = w * 0.18;
    const y = h * 0.16;
    const bw = w * 0.64;
    const bh = h * 0.5;
    const radius = Math.min(w, h) * 0.03;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + bw - radius, y);
    ctx.quadraticCurveTo(x + bw, y, x + bw, y + radius);
    ctx.lineTo(x + bw, y + bh - radius);
    ctx.quadraticCurveTo(x + bw, y + bh, x + bw - radius, y + bh);
    ctx.lineTo(x + radius, y + bh);
    ctx.quadraticCurveTo(x, y + bh, x, y + bh - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.36, h * 0.76);
    ctx.lineTo(w * 0.64, h * 0.76);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.44, h * 0.66);
    ctx.lineTo(w * 0.56, h * 0.66);
    ctx.lineTo(w * 0.64, h * 0.76);
    ctx.lineTo(w * 0.36, h * 0.76);
    ctx.closePath();
    ctx.stroke();
  } else if (kind === "pencil") {
    const cx = w * 0.5;
    const cy = h * 0.5;
    const len = Math.min(w, h) * 0.68;
    const thick = Math.min(w, h) * 0.12;
    const angle = -Math.PI / 5;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeRect(-len * 0.4, -thick / 2, len * 0.65, thick);
    ctx.beginPath();
    ctx.moveTo(len * 0.25, -thick / 2);
    ctx.lineTo(len * 0.4, 0);
    ctx.lineTo(len * 0.25, thick / 2);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-len * 0.4, -thick / 2);
    ctx.lineTo(-len * 0.54, -thick / 2);
    ctx.lineTo(-len * 0.54, thick / 2);
    ctx.lineTo(-len * 0.4, thick / 2);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  const imageData = ctx.getImageData(0, 0, w, h).data;
  const points = [];
  const step = isMobile ? 7 : 5;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (imageData[(y * w + x) * 4 + 3] > 20) {
        points.push({ x: x + (width - w) / 2, y: y + (height - h) / 2 });
      }
    }
  }
  return points;
}

const LANG_SETS = [
  ["art",          "technology",    "marketing"   ],
  ["\u827a\u672f", "\u6280\u672f",  "\u8425\u9500"],
  ["\u82b8\u8853", "\u30c6\u30af\u30ce\u30ed\u30b8\u30fc", "\u30de\u30fc\u30b1\u30c6\u30a3\u30f3\u30b0"],
  ["Kunst",        "Technologie",   "Marketing"   ],
  ["\u0641\u0646", "\u062a\u0643\u0646\u0648\u043b\u0648\u062c\u064a\u0627", "\u062a\u0633\u0648\u064a\u0642"],
  ["\u043c\u0438\u0441\u0442\u0435\u0446\u0442\u0432\u043e", "\u0442\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0456\u044f", "\u043c\u0430\u0440\u043a\u0435\u0442\u0438\u043d\u0433"],
];

function useTagline() {
  const base = LANG_SETS[0].join(", ");
  const [text, setText] = useState("");
  const [langIdx, setLangIdx] = useState(-1); // -1 = typewriter phase

  // Typewriter
  useEffect(() => {
    if (langIdx !== -1) return;
    if (text.length < base.length) {
      const id = setTimeout(() => setText(base.slice(0, text.length + 1)), 65);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setLangIdx(1), 1800); // skip 0 (already shown), start at 1
    return () => clearTimeout(id);
  }, [langIdx, text]);

  // Language cycling
  useEffect(() => {
    if (langIdx < 0) return;
    const set = LANG_SETS[langIdx % LANG_SETS.length];
    setText(set.join(", "));
    const id = setTimeout(() => setLangIdx(langIdx + 1), 2200);
    return () => clearTimeout(id);
  }, [langIdx]);

  const isTyping = langIdx === -1 && text.length < base.length;
  return { text: text || "\u00a0", isTyping };
}

function App() {
  const canvasRef = useRef(null);
  const { text: tagline, isTyping } = useTagline();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let isMobile = width <= 768;

    const SHAPES = ["globe", "face", "mac", "pencil"];
    let shapeIndex = 0;

    const particleCount = isMobile ? 700 : 1300;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0, vy: 0,
      tx: width / 2, ty: height / 2,
    }));

    const assignTargets = () => {
      const targets = makePointsForShape(SHAPES[shapeIndex], width, height, isMobile);
      for (let i = 0; i < particles.length; i++) {
        const t = targets[i % targets.length];
        particles[i].tx = t.x;
        particles[i].ty = t.y;
      }
    };

    assignTargets();

    const mouse = { x: -9999, y: -9999, active: false };

    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      isMobile = width <= 768;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      assignTargets();
    };

    setSize();

    window.addEventListener("resize", setSize);
    window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
    window.addEventListener("touchmove", () => { mouse.active = false; }, { passive: true });
    window.addEventListener("mouseleave", () => { mouse.active = false; });

    const shapeTimer = setInterval(() => {
      shapeIndex = (shapeIndex + 1) % SHAPES.length;
      assignTargets();
    }, isMobile ? 3400 : 3000);

    let raf = null;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(80, 220, 130, 0.88)";

      const safeHalfW = isMobile ? 135 : 260;
      const safeHalfH = isMobile ? 70 : 120;
      const cx = width * 0.5;
      const cy = height * 0.5;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.vx += (p.tx - p.x) * 0.008;
        p.vy += (p.ty - p.y) * 0.008;

        if (mouse.active && !isMobile) {
          const mx = p.x - mouse.x;
          const my = p.y - mouse.y;
          const d2 = mx * mx + my * my;
          const R = 110;
          if (d2 < R * R) {
            const push = (R * R - d2) / (R * R);
            const a = Math.atan2(my, mx);
            p.vx += Math.cos(a) * push * 1.2;
            p.vy += Math.sin(a) * push * 1.2;
          }
        }

        if (Math.abs(p.x - cx) < safeHalfW && Math.abs(p.y - cy) < safeHalfH) {
          p.vx += (p.x >= cx ? 1 : -1) * 0.7;
          p.vy += (p.y >= cy ? 1 : -1) * 0.5;
        }

        p.vx *= 0.84;
        p.vy *= 0.84;
        p.x += p.vx;
        p.y += p.vy;

        ctx.fillRect(p.x, p.y, isMobile ? 1.8 : 2.2, isMobile ? 1.8 : 2.2);
      }

      raf = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(shapeTimer);
      window.removeEventListener("resize", setSize);
      window.removeEventListener("mousemove", () => {});
      window.removeEventListener("touchmove", () => {});
      window.removeEventListener("mouseleave", () => {});
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
