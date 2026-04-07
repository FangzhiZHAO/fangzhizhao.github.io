const { useEffect, useRef, useState } = React;

function makePointsForShape(kind, width, height, isMobile) {
  const off = document.createElement("canvas");
  const w = Math.floor(Math.min(width * 0.66, 660));
  const h = Math.floor(Math.min(height * 0.5, 420));
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d");

  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  ctx.lineWidth = Math.max(4, Math.min(w, h) * 0.03);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (kind === "globe") {
    const r = Math.min(w, h) * 0.28;
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

    for (const y of [-0.45, 0, 0.45]) {
      const ry = r * Math.cos(Math.asin(Math.min(0.95, Math.abs(y))));
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * y, r, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (kind === "face") {
    const r = Math.min(w, h) * 0.27;
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
    const x = w * 0.2;
    const y = h * 0.2;
    const bw = w * 0.6;
    const bh = h * 0.45;
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
    ctx.moveTo(w * 0.38, h * 0.74);
    ctx.lineTo(w * 0.62, h * 0.74);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.65);
    ctx.lineTo(w * 0.55, h * 0.65);
    ctx.lineTo(w * 0.62, h * 0.74);
    ctx.lineTo(w * 0.38, h * 0.74);
    ctx.closePath();
    ctx.stroke();
  } else if (kind === "pencil") {
    const cx = w * 0.5;
    const cy = h * 0.5;
    const len = Math.min(w, h) * 0.62;
    const thick = Math.min(w, h) * 0.11;
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
      const alpha = imageData[(y * w + x) * 4 + 3];
      if (alpha > 20) {
        points.push({ x: x + (width - w) / 2, y: y + (height - h) / 2 });
      }
    }
  }

  return points;
}

function App() {
  const canvasRef = useRef(null);
  const [shapeLabel, setShapeLabel] = useState("Globe");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const quotes = [
    "art, technology, marketing",
    "Stories designed at the intersection of code and culture.",
    "Creative systems for human connection.",
    "From concept to campaign, crafted with intention."
  ];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyPreference = () => setPrefersReducedMotion(media.matches);
    applyPreference();

    media.addEventListener("change", applyPreference);
    return () => media.removeEventListener("change", applyPreference);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, prefersReducedMotion ? 10000 : 3600);
    return () => clearInterval(timer);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let isMobile = width <= 768;

    const names = ["globe", "face", "mac", "pencil"];
    const displayNames = {
      globe: "Globe",
      face: "Face",
      mac: "Mac",
      pencil: "Pencil"
    };

    const particleCount = prefersReducedMotion
      ? isMobile
        ? 220
        : 380
      : isMobile
      ? 700
      : 1300;

    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      tx: width / 2,
      ty: height / 2
    }));

    let shapeIndex = 0;

    const assignTargets = () => {
      const targets = makePointsForShape(names[shapeIndex], width, height, isMobile);
      for (let i = 0; i < particles.length; i += 1) {
        const target = targets[i % targets.length];
        particles[i].tx = target.x;
        particles[i].ty = target.y;
      }
      setShapeLabel(displayNames[names[shapeIndex]]);
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

    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const onTouchMove = () => {
      mouse.active = false;
    };

    const onLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("resize", setSize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    const shapeTimer = prefersReducedMotion
      ? null
      : setInterval(() => {
          shapeIndex = (shapeIndex + 1) % names.length;
          assignTargets();
        }, isMobile ? 3400 : 2800);

    let raf = null;
    let frameCount = 0;
    const animate = () => {
      frameCount += 1;
      if (prefersReducedMotion && frameCount % 2 === 1) {
        raf = requestAnimationFrame(animate);
        return;
      }

      ctx.fillStyle = prefersReducedMotion ? "rgba(8, 11, 19, 0.4)" : "rgba(8, 11, 19, 0.2)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(113, 199, 255, 0.9)";

      const safeHalfW = isMobile ? 135 : 260;
      const safeHalfH = isMobile ? 70 : 120;
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const antiGravity = prefersReducedMotion ? 0 : Math.max(0, Math.sin(frameCount * 0.03)) * 0.03;

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;

        p.vx += dx * 0.008;
        p.vy += dy * 0.008;
        p.vy -= antiGravity;
        p.vx += Math.sin((frameCount + p.y) * 0.01) * (prefersReducedMotion ? 0 : 0.01);

        if (!prefersReducedMotion && mouse.active && !isMobile) {
          const mx = p.x - mouse.x;
          const my = p.y - mouse.y;
          const dist2 = mx * mx + my * my;
          const radius = 110;
          if (dist2 < radius * radius) {
            const push = (radius * radius - dist2) / (radius * radius);
            const angle = Math.atan2(my, mx);
            p.vx += Math.cos(angle) * push * 1.2;
            p.vy += Math.sin(angle) * push * 1.2;
          }
        }

        const inSafeZone =
          Math.abs(p.x - centerX) < safeHalfW &&
          Math.abs(p.y - centerY) < safeHalfH;
        if (inSafeZone) {
          const awayX = p.x >= centerX ? 1 : -1;
          const awayY = p.y >= centerY ? 1 : -1;
          p.vx += awayX * 0.7;
          p.vy += awayY * 0.5;
        }

        p.vx *= prefersReducedMotion ? 0.9 : 0.84;
        p.vy *= prefersReducedMotion ? 0.9 : 0.84;
        p.x += p.vx;
        p.y += p.vy;

        ctx.fillRect(p.x, p.y, isMobile ? 1.8 : 2.2, isMobile ? 1.8 : 2.2);
      }

      raf = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      if (shapeTimer) clearInterval(shapeTimer);
      window.removeEventListener("resize", setSize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [prefersReducedMotion]);

  return React.createElement(
    "div",
    { className: "site" },
    React.createElement("canvas", { ref: canvasRef, "aria-hidden": "true" }),
    React.createElement(
      "nav",
      { className: "nav", "aria-label": "Main" },
      React.createElement(
        "a",
        { href: "https://marketingos.blog", target: "_blank", rel: "noreferrer" },
        "Blog"
      ),
      React.createElement("a", { href: "/about/" }, "About")
    ),
    React.createElement(
      "main",
      { className: "centerpiece" },
      React.createElement(
        "div",
        { className: "center-card" },
        React.createElement("h1", null, "Fangzhi Zhao"),
        React.createElement("p", { className: "tagline" }, quotes[quoteIndex]),
        React.createElement("p", { className: "shape" }, "Interactive particles: ", shapeLabel)
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
