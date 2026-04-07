const { useEffect, useRef, useState } = React;

function makePointsForShape(width, height, isMobile) {
  const off = document.createElement("canvas");
  const w = Math.floor(Math.min(width * 0.84, 900));
  const h = Math.floor(Math.min(height * 0.74, 640));
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d");

  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  ctx.lineWidth = Math.max(5, Math.min(w, h) * 0.035);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const r = Math.min(w, h) * 0.36;
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

  const imageData = ctx.getImageData(0, 0, w, h).data;
  const points = [];
  const step = isMobile ? 6 : 4;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const alpha = imageData[(y * w + x) * 4 + 3];
      if (alpha > 20) {
        points.push({ x: x + (width - w) / 2, y: y + (height - h) / 2 });
      }
    }
  }

  return points;
}

function useTagline() {
  const base = "art, technology, marketing";
  const foreignCycle = [
    "\u827a\u672f, technology, marketing",
    "art, technologie, marketing",
    "art, technology, \u062a\u0633\u0648\u064a\u0642",
    "art, technology, marketing",
  ];
  const sequence = [...foreignCycle, ...foreignCycle, ...foreignCycle];

  const [text, setText] = useState("");
  const [seqIdx, setSeqIdx] = useState(-1);

  useEffect(() => {
    if (seqIdx !== -1) return;
    if (text.length < base.length) {
      const id = setTimeout(() => setText(base.slice(0, text.length + 1)), 65);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setSeqIdx(0), 1800);
    return () => clearTimeout(id);
  }, [seqIdx, text]);

  useEffect(() => {
    if (seqIdx < 0 || seqIdx >= sequence.length) return;
    setText(sequence[seqIdx]);
    const isEnglish = sequence[seqIdx] === base;
    const id = setTimeout(() => setSeqIdx(seqIdx + 1), isEnglish ? 2600 : 2000);
    return () => clearTimeout(id);
  }, [seqIdx]);

  const isTyping = seqIdx === -1 && text.length < base.length;
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

    const particleCount = isMobile ? 800 : 1500;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      tx: width / 2,
      ty: height / 2,
    }));

    const assignTargets = () => {
      const targets = makePointsForShape(width, height, isMobile);
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

    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; };
    const onTouchMove = () => { mouse.active = false; };
    const onLeave = () => { mouse.active = false; };

    window.addEventListener("resize", setSize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    let raf = null;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(80, 220, 130, 0.88)";

      const safeHalfW = isMobile ? 135 : 260;
      const safeHalfH = isMobile ? 70 : 120;
      const centerX = width * 0.5;
      const centerY = height * 0.5;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.vx += (p.tx - p.x) * 0.008;
        p.vy += (p.ty - p.y) * 0.008;

        if (mouse.active && !isMobile) {
          const mx = p.x - mouse.x;
          const my = p.y - mouse.y;
          const dist2 = mx * mx + my * my;
          const radius = 120;
          if (dist2 < radius * radius) {
            const push = (radius * radius - dist2) / (radius * radius);
            const angle = Math.atan2(my, mx);
            p.vx += Math.cos(angle) * push * 1.3;
            p.vy += Math.sin(angle) * push * 1.3;
          }
        }

        if (
          Math.abs(p.x - centerX) < safeHalfW &&
          Math.abs(p.y - centerY) < safeHalfH
        ) {
          p.vx += (p.x >= centerX ? 1 : -1) * 0.7;
          p.vy += (p.y >= centerY ? 1 : -1) * 0.5;
        }

        p.vx *= 0.84;
        p.vy *= 0.84;
        p.x += p.vx;
        p.y += p.vy;

        ctx.fillRect(p.x, p.y, isMobile ? 2 : 2.4, isMobile ? 2 : 2.4);
      }

      raf = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", setSize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
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
    React.createElement(
      "footer", { className: "footer" },
      "\u00a9 2016\u20132026 Fangzhi Zhao"
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
