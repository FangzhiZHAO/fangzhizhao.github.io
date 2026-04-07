const { useEffect, useRef, useState } = React;

const SHAPES = ["globe", "face", "mac", "pencil"];
const SHAPE_EMOJI = { globe: "🌍", face: "😊", mac: "💻", pencil: "✏️" };

function makePointsForShape(kind, width, height, isMobile) {
  const sz = Math.floor(Math.min(width * 0.52, height * 0.62, 500));
  const off = document.createElement("canvas");
  off.width = sz;
  off.height = sz;
  const ctx = off.getContext("2d");
  ctx.clearRect(0, 0, sz, sz);
  ctx.font = `${Math.floor(sz * 0.80)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(SHAPE_EMOJI[kind], sz / 2, sz / 2);

  const data = ctx.getImageData(0, 0, sz, sz).data;
  const points = [];
  const step = isMobile ? 6 : 4;
  // offset shape to upper portion so it doesn't sit on the name text
  const offsetX = (width - sz) / 2;
  const offsetY = (height - sz) / 2 - height * 0.06;

  for (let y = 0; y < sz; y += step) {
    for (let x = 0; x < sz; x += step) {
      if (data[(y * sz + x) * 4 + 3] > 30) {
        points.push({ x: x + offsetX, y: y + offsetY });
      }
    }
  }
  return points;
}

// Language sets — words displayed as "Art. Technology. Marketing."
const LANG_SETS = [
  ["Art",       "Technology",    "Marketing"    ],  // English
  ["Arte",      "Tecnología",    "Marketing"    ],  // Spanish
  ["\u827a\u672f", "\u6280\u672f", "\u8425\u9500"], // Chinese
  ["\u82b8\u8853", "\u30c6\u30af\u30ce\u30ed\u30b8\u30fc", "\u30de\u30fc\u30b1\u30c6\u30a3\u30f3\u30b0"], // Japanese
  ["Kunst",     "Technologie",   "Marketing"    ],  // German
  ["\u0641\u0646", "\u062a\u0643\u0646\u0648\u0644\u0648\u062c\u064a\u0627", "\u062a\u0633\u0648\u064a\u0642"], // Arabic
  ["\u041c\u0438\u0441\u0442\u0435\u0446\u0442\u0432\u043e", "\u0422\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0456\u044f", "\u041c\u0430\u0440\u043a\u0435\u0442\u0438\u043d\u0433"], // Ukrainian
];

function formatTagline(set) {
  return set[0] + ". " + set[1] + ". " + set[2] + ".";
}

function useTagline() {
  const base = formatTagline(LANG_SETS[0]);
  const [text, setText] = useState("");
  const [langIdx, setLangIdx] = useState(-1);

  // Typewriter phase
  useEffect(() => {
    if (langIdx !== -1) return;
    if (text.length < base.length) {
      const id = setTimeout(() => setText(base.slice(0, text.length + 1)), 60);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setLangIdx(1), 1800);
    return () => clearTimeout(id);
  }, [langIdx, text]);

  // Language cycling (starts at index 1, wraps through all)
  useEffect(() => {
    if (langIdx < 0) return;
    setText(formatTagline(LANG_SETS[langIdx % LANG_SETS.length]));
    const id = setTimeout(() => setLangIdx(langIdx + 1), 2400);
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
        particles[i].tx = t.x;
        particles[i].ty = t.y;
      }
    };

    const mouse = { x: -9999, y: -9999, active: false };

    const setSize = () => {
      width = window.innerWidth; height = window.innerHeight;
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

    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; };
    const onTouch = () => { mouse.active = false; };
    const onLeave = () => { mouse.active = false; };
    window.addEventListener("resize", setSize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    const shapeTimer = setInterval(() => {
      shapeIndex = (shapeIndex + 1) % SHAPES.length;
      assignTargets();
    }, isMobile ? 3400 : 3000);

    let raf = null;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(80, 220, 130, 0.88)";

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
        React.createElement("p", { className: isTyping ? "tagline typing" : "tagline", dir: "ltr" }, tagline)
      )
    ),
    React.createElement("footer", { className: "footer" }, "\u00a9 2016\u20132026 Fangzhi Zhao")
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
