// Global error handler: show JS errors on page for debugging
window.addEventListener("error", (e) => {
  console.error("[Global Error]", e.message, "at", e.filename, ":", e.lineno);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("[Unhandled Promise]", e.reason);
});

const canvas = document.querySelector("#motion-bg");
const ctx = canvas.getContext("2d");
const sections = [...document.querySelectorAll("[data-scene]")];
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const quoteForm = document.querySelector(".quote-form");
const footer = document.querySelector(".site-footer");
const stageStep = document.querySelector(".stage-step");
const stageTitle = document.querySelector(".stage-title");
const stageDetail = document.querySelector(".stage-detail");

// Safety check: ensure critical elements exist
if (!quoteForm) console.error("[Init] quoteForm (.quote-form) not found!");
if (!canvas) console.error("[Init] canvas (#motion-bg) not found!");

const sceneText = {
  hero: ["Overview", "Drawing to Delivery", "A clear manufacturing path from first review to export-ready parts."],
  proof: ["Company", "Manufacturing Base", "Company scale, factory location, and project proof before RFQ."],
  video: ["Factory Video", "Manufacturing Tour", "A short factory video can make capability easier to trust."],
  capabilities: ["Capabilities", "Manufacturing Coverage", "DFM, tooling, molding, inspection, and export support under one team."],
  blueprint: ["Stage 01", "Engineering Review", "DFM feedback helps reduce tooling risk before investment."],
  tooling: ["Stage 02", "Mold Making", "Machining, fitting, polishing, and mold trials stay connected."],
  injection: ["Stage 03", "Injection Molding", "Stable molding turns approved tooling into repeatable plastic parts."],
  quality: ["Stage 04", "Quality Control", "Dimensional checks and visual review support export-ready delivery."],
  equipment: ["Factory Capability", "Equipment & Inspection", "Machine range and inspection tools buyers can verify quickly."],
  industries: ["Applications", "Industries Served", "Plastic parts for products where fit, finish, and repeatability matter."],
  samples: ["Sample Proof", "Parts & Applications", "Materials, finishes, and part examples help buyers match requirements."],
  trust: ["Buyer Confidence", "Clearer Communication", "Visible factory evidence helps reduce sourcing risk."],
  delivery: ["Stage 05", "Packing & Delivery", "Finished parts are prepared for global buyers and repeat orders."],
  quote: ["Stage 06", "RFQ Review", "Drawings, materials, quantities, and timelines become a clearer quote."]
};

let width = 0;
let height = 0;
let dpr = 1;
let currentScene = "hero";
let sceneProgress = 0;
let smoothedProgress = 0;
let time = 0;
let lastScrollY = window.scrollY;
let pointerNearTop = false;
let scrollTicking = false;
let lastAnimationTime = 0;

const colors = {
  ink: [16, 24, 32],
  blue: [14, 91, 216],
  cyan: [78, 198, 223],
  amber: [232, 163, 50],
  green: [63, 166, 107],
  paper: [247, 245, 240]
};

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 1.35);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function setSceneFromScroll() {
  const scrollY = window.scrollY;
  const scrollingDown = scrollY > lastScrollY + 4;
  const scrollingUp = scrollY < lastScrollY - 4;
  const activationLine = height * 0.42;
  let active = null;

  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= activationLine && rect.bottom >= activationLine) {
      active = section;
      sceneProgress = Math.min(1, Math.max(0, (activationLine - rect.top) / Math.max(rect.height, 1)));
      break;
    }
  }

  if (!active) {
    for (let index = sections.length - 1; index >= 0; index -= 1) {
      if (sections[index].getBoundingClientRect().top <= activationLine) {
        active = sections[index];
        break;
      }
    }
    active = active || sections[0];
    const rect = active.getBoundingClientRect();
    sceneProgress = Math.min(1, Math.max(0, (activationLine - rect.top) / Math.max(rect.height, 1)));
  }

  const nextScene = active.dataset.scene;
  currentScene = nextScene;
  if (document.body.dataset.scene !== nextScene) {
    document.body.dataset.scene = nextScene;
  }
  document.body.style.setProperty("--scene-progress", sceneProgress.toFixed(3));
  const footerVisible = footer ? footer.getBoundingClientRect().top < height * 0.82 : false;
  const stageHidden = footerVisible ? "true" : "false";
  if (document.body.dataset.stageHidden !== stageHidden) {
    document.body.dataset.stageHidden = stageHidden;
  }
  const elevated = window.scrollY > 40 ? "true" : "false";
  if (header.dataset.elevated !== elevated) {
    header.dataset.elevated = elevated;
  }
  if (document.body.classList.contains("nav-open") || pointerNearTop || scrollY < 120 || scrollingUp) {
    header.dataset.hidden = "false";
  } else if (scrollingDown && scrollY > 180) {
    header.dataset.hidden = "true";
  }
  lastScrollY = scrollY;

  const text = sceneText[currentScene] || sceneText.hero;
  if (stageStep.textContent !== text[0]) stageStep.textContent = text[0];
  if (stageTitle.textContent !== text[1]) stageTitle.textContent = text[1];
  if (stageDetail.textContent !== text[2]) stageDetail.textContent = text[2];
}

function handleHeaderReveal(event) {
  const nearTop = event.clientY <= 112;
  if (nearTop === pointerNearTop) return;
  pointerNearTop = nearTop;
  if (pointerNearTop || document.body.classList.contains("nav-open") || window.scrollY < 120) {
    header.dataset.hidden = "false";
  } else if (window.scrollY > 180) {
    header.dataset.hidden = "true";
  }
}

function scheduleSceneUpdate() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    scrollTicking = false;
    setSceneFromScroll();
  });
}

function rgba(color, alpha) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function line(x1, y1, x2, y2, color, widthValue = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = widthValue;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

function clearStage() {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(247,245,240,0.32)");
  gradient.addColorStop(0.48, "rgba(247,245,240,0.18)");
  gradient.addColorStop(1, "rgba(247,245,240,0.02)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.translate(width * 0.58, height * 0.5);
  ctx.rotate(-0.1);
  for (let i = -8; i < 12; i++) {
    line(i * 92, -height, i * 92 + 120, height, "rgba(16,24,32,0.035)");
  }
  ctx.restore();
}

function drawMoldBase(alpha = 0.55) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const cx = width * 0.7;
  const cy = height * 0.52;
  const plateW = Math.min(260, width * 0.18);
  const plateH = Math.min(280, height * 0.32);
  const gap = 20 + smoothedProgress * 34;

  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.strokeStyle = "rgba(16,24,32,0.12)";
  ctx.lineWidth = 1;
  roundedRect(cx - plateW - gap, cy - plateH / 2, plateW, plateH, 12);
  ctx.fill();
  ctx.stroke();
  roundedRect(cx + gap, cy - plateH / 2, plateW, plateH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(14,91,216,0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx - gap * 0.18, cy, 58, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + gap * 0.18, cy, 58, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 7; i++) {
    const y = cy - 116 + i * 38;
    line(cx - plateW - gap + 28, y, cx - gap - 28, y, "rgba(16,24,32,0.075)");
    line(cx + gap + 28, y, cx + plateW + gap - 28, y, "rgba(16,24,32,0.075)");
  }
  ctx.restore();
}

function drawPart(x, y, scale = 1, alpha = 0.72, warm = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  const fill = warm
    ? ctx.createLinearGradient(-50, -50, 70, 80)
    : ctx.createLinearGradient(-50, -50, 70, 80);
  if (warm) {
    fill.addColorStop(0, "rgba(255,241,210,0.95)");
    fill.addColorStop(0.42, "rgba(232,163,50,0.55)");
    fill.addColorStop(1, "rgba(78,198,223,0.32)");
  } else {
    fill.addColorStop(0, "rgba(255,255,255,0.95)");
    fill.addColorStop(0.44, "rgba(78,198,223,0.42)");
    fill.addColorStop(1, "rgba(14,91,216,0.22)");
  }
  ctx.fillStyle = fill;
  ctx.strokeStyle = warm ? "rgba(232,163,50,0.38)" : "rgba(14,91,216,0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-58, -26);
  ctx.bezierCurveTo(-26, -68, 48, -52, 64, -6);
  ctx.bezierCurveTo(76, 42, 34, 78, -16, 66);
  ctx.bezierCurveTo(-70, 52, -86, 8, -58, -26);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.65;
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(-8, 2, 26, 0.2, Math.PI * 1.72);
  ctx.stroke();
  ctx.restore();
}

function drawBlueprintScene() {
  ctx.save();
  ctx.translate(width * 0.57, height * 0.5);
  ctx.rotate(-0.07);
  const draw = Math.min(1, smoothedProgress * 1.5 + 0.2);
  ctx.lineWidth = 1;
  for (let i = -5; i <= 5; i++) {
    line(-520, i * 52, 520 * draw, i * 52, "rgba(16,24,32,0.055)");
    line(i * 70, -360, i * 70, 360, "rgba(78,198,223,0.09)");
  }
  ctx.strokeStyle = rgba(colors.blue, 0.28);
  ctx.lineWidth = 2;
  ctx.setLineDash([Math.max(20, draw * 1400), 1400]);
  roundedRect(-155, -105, 310, 210, 10);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = rgba(colors.cyan, 0.3);
  ctx.beginPath();
  ctx.arc(0, 0, 62, 0, Math.PI * 2 * draw);
  ctx.stroke();
  ctx.fillStyle = rgba(colors.ink, 0.36);
  ctx.font = "12px Inter, Arial";
  ctx.fillText("gate", -210, -126);
  ctx.fillText("draft 1.5 deg", 90, 136);
  line(-190, -120, -72, -55, rgba(colors.blue, 0.25));
  line(110, 128, 58, 48, rgba(colors.blue, 0.25));
  ctx.restore();
}

function drawToolingScene() {
  drawMoldBase(0.74);
  ctx.save();
  ctx.translate(width * 0.56, height * 0.2);
  const spindleX = width * 0.12 + Math.sin(time * 0.0011) * 90;
  const spindleY = height * 0.2 + Math.cos(time * 0.0017) * 32;
  ctx.fillStyle = "rgba(16,24,32,0.16)";
  roundedRect(spindleX, spindleY, 54, 160, 8);
  ctx.fill();
  ctx.fillStyle = rgba(colors.amber, 0.7);
  ctx.beginPath();
  ctx.moveTo(spindleX + 19, spindleY + 160);
  ctx.lineTo(spindleX + 35, spindleY + 160);
  ctx.lineTo(spindleX + 27, spindleY + 210);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 18; i++) {
    const y = height * 0.28 + i * 18;
    const offset = Math.sin(time * 0.002 + i) * 28;
    ctx.strokeStyle = i % 4 === 0 ? rgba(colors.amber, 0.28) : "rgba(16,24,32,0.075)";
    ctx.lineWidth = i % 4 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(width * 0.05, y);
    ctx.bezierCurveTo(width * 0.19, y + offset, width * 0.33, y - offset, width * 0.47, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawInjectionScene() {
  drawMoldBase(0.66);
  const cy = height * 0.52;
  const startX = width * 0.42;
  const endX = width * 0.82;
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = rgba(colors.amber, 0.26);
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(startX, cy);
  ctx.bezierCurveTo(width * 0.54, cy - 92, width * 0.64, cy + 92, endX, cy);
  ctx.stroke();

  for (let i = 0; i < 54; i++) {
    const p = (time * 0.00012 + i / 54) % 1;
    const x = startX + (endX - startX) * p;
    const y = cy + Math.sin(p * Math.PI * 3 + time * 0.002) * 48;
    const r = 2 + p * 5 + Math.sin(i + time * 0.004) * 1.2;
    ctx.fillStyle = rgba(colors.amber, 0.1 + p * 0.28);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, r), 0, Math.PI * 2);
    ctx.fill();
  }
  drawPart(width * 0.72, cy, 1.05, 0.82, true);
  ctx.restore();
}

function drawQualityScene() {
  drawPart(width * 0.72, height * 0.52, 1.25, 0.82, false);
  ctx.save();
  const scanY = height * 0.23 + ((time * 0.07) % (height * 0.58));
  const grad = ctx.createLinearGradient(0, scanY - 42, 0, scanY + 42);
  grad.addColorStop(0, "rgba(78,198,223,0)");
  grad.addColorStop(0.5, "rgba(78,198,223,0.26)");
  grad.addColorStop(1, "rgba(78,198,223,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(width * 0.42, scanY - 42, width * 0.52, 84);
  for (let i = 0; i < 5; i++) {
    const x = width * 0.5 + i * width * 0.08;
    line(x, height * 0.24, x, height * 0.8, "rgba(63,166,107,0.08)");
  }
  ctx.strokeStyle = rgba(colors.green, 0.35);
  ctx.lineWidth = 2;
  roundedRect(width * 0.61, height * 0.39, width * 0.22, height * 0.25, 12);
  ctx.stroke();
  ctx.restore();
}

function drawDeliveryScene() {
  ctx.save();
  const y = height * 0.52;
  const labels = ["DFM", "Tool", "Mold", "QC", "Ship"];
  line(width * 0.42, y, width * 0.9, y, rgba(colors.blue, 0.2), 2);
  labels.forEach((label, index) => {
    const x = width * 0.44 + index * width * 0.105;
    const active = smoothedProgress * 5 >= index;
    ctx.fillStyle = active ? rgba(colors.blue, 0.22) : "rgba(255,255,255,0.46)";
    ctx.strokeStyle = active ? rgba(colors.blue, 0.32) : "rgba(16,24,32,0.1)";
    roundedRect(x - 36, y - 52, 72, 38, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = active ? rgba(colors.ink, 0.8) : rgba(colors.ink, 0.42);
    ctx.font = "700 12px Inter, Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y - 28);
    ctx.beginPath();
    ctx.fillStyle = active ? rgba(colors.green, 0.5) : "rgba(16,24,32,0.14)";
    ctx.arc(x, y, 7 + Math.sin(time * 0.004 + index) * 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawHeroScene() {
  drawBlueprintScene();
  ctx.save();
  ctx.globalAlpha = 0.55;
  drawMoldBase(0.58);
  drawPart(width * 0.74, height * 0.52, 1.05, 0.62, false);
  ctx.restore();
}

function animate(now) {
  if (now - lastAnimationTime < 32) {
    requestAnimationFrame(animate);
    return;
  }
  lastAnimationTime = now;
  time = now;
  smoothedProgress += (sceneProgress - smoothedProgress) * 0.06;
  clearStage();

  if (currentScene === "hero") drawHeroScene();
  if (currentScene === "capabilities") drawDeliveryScene();
  if (currentScene === "blueprint") drawBlueprintScene();
  if (currentScene === "tooling") drawToolingScene();
  if (currentScene === "injection") drawInjectionScene();
  if (currentScene === "quality") drawQualityScene();
  if (currentScene === "proof") drawHeroScene();
  if (currentScene === "video") drawBlueprintScene();
  if (currentScene === "equipment") drawQualityScene();
  if (currentScene === "delivery") drawDeliveryScene();
  if (currentScene === "industries" || currentScene === "samples" || currentScene === "trust") drawDeliveryScene();
  if (currentScene === "quote") {
    drawQualityScene();
    ctx.save();
    ctx.globalAlpha = 0.64;
    drawDeliveryScene();
    ctx.restore();
  }

  requestAnimationFrame(animate);
}

navToggle.addEventListener("click", () => {
  const open = !document.body.classList.contains("nav-open");
  document.body.classList.toggle("nav-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  header.dataset.hidden = "false";
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

function setupMagneticTargets() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  if (reduceMotion || coarsePointer) return;

  document.querySelectorAll(".button, .nav-links a, .video-frame").forEach((target) => {
    const isVideo = target.classList.contains("video-frame");
    const strength = isVideo ? 0.08 : 0.14;
    const maxShift = isVideo ? 7 : 6;
    let frame = 0;

    target.addEventListener("mousemove", (event) => {
      if (frame) cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = target.getBoundingClientRect();
        const offsetX = event.clientX - rect.left - rect.width / 2;
        const offsetY = event.clientY - rect.top - rect.height / 2;
        const x = Math.max(-maxShift, Math.min(maxShift, offsetX * strength));
        const y = Math.max(-maxShift, Math.min(maxShift, offsetY * strength));

        target.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        target.dataset.magnetic = "true";
      });
    }, { passive: true });

    target.addEventListener("mouseleave", () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      target.style.transform = "";
      target.dataset.magnetic = "false";
    });
  });
}

// Form submission — AJAX with graceful fallback to mailto
if (quoteForm) {
  // Set timestamp when page loads (anti-bot: form must take >3s to fill)
  const tsField = quoteForm.querySelector('input[name="_ts"]');
  if (tsField) tsField.value = String(Date.now());

  // Clear honeypot if browser autofill/extension filled it (humans can't see this field)
  const honeypot = quoteForm.querySelector('input[name="company_zip"]');
  if (honeypot && honeypot.value.trim() !== "") {
    console.warn("[Form] Honeypot was autofilled by browser/extension — clearing.");
    honeypot.value = "";
  }

  quoteForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const alertBox = quoteForm.querySelector(".form-alert");
    const btn = quoteForm.querySelector('button[type="submit"]');
    const honeypotCurrent = quoteForm.querySelector('input[name="company_zip"]');

    // Front-end honeypot check (catches bots that fill hidden fields during submission)
    if (honeypotCurrent && honeypotCurrent.value.trim() !== "") {
      if (alertBox) {
        alertBox.textContent = "This looks like an automated submission. If you're human, please try disabling browser extensions or contact us directly at sales@cemalengineering.com";
        alertBox.className = "form-alert error";
      }
      return;
    }

    // Collect form data
    const formData = new FormData(quoteForm);
    const data = {};
    formData.forEach((v, k) => { if (k !== "drawing") data[k] = v; });

    // Handle file attachment
    const fileInput = quoteForm.querySelector('input[type="file"]');
    const file = fileInput && fileInput.files[0];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    function doSubmit(payload) {
      // Disable button during submit
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      if (alertBox) { alertBox.textContent = ""; alertBox.className = "form-alert"; }

      fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(res => res.json().catch(() => ({ success: false, message: "Server error" })))
        .then(result => {
          if (result.success) {
            if (alertBox) {
              alertBox.innerHTML = '<strong>Request sent successfully!</strong> We will respond within 24 hours.' + (file ? '<br><small>Attachment included: ' + escapeHtml(file.name) + '</small>' : '');
              alertBox.className = "form-alert success";
            }
            quoteForm.reset();
            if (tsField) tsField.value = String(Date.now());
            if (typeof gtag === "function") {
              gtag("event", "conversion", { event_category: "rfq", event_label: "quote_form_success" });
            }
          } else {
            throw new Error(result.message || "Send failed");
          }
        })
        .catch(err => {
          console.error("[Form] Submit error:", err);
          const subject = encodeURIComponent(`Manufacturing RFQ - ${data.project || "Cemal Engineering"}`);
          const body = encodeURIComponent(
            `Name: ${data.name || ""}%0D%0A` +
            `Email: ${data.email || ""}%0D%0A` +
            `Phone: ${data.phone || ""}%0D%0A` +
            `Project: ${data.project || ""}%0D%0A` +
            `Quantity: ${data.quantity || ""}%0D%0A` +
            `Material: ${data.material || ""}%0D%0A` +
            `Timeline: ${data.delivery || ""}%0D%0A` +
            `%0D%0AMessage:%0D%0A${data.message || ""}` +
            (file ? `%0D%0A%0D%0A[ATTACHMENT: ${file.name}]` : "")
          );
          if (alertBox) {
            alertBox.innerHTML = `Email service is temporarily unavailable. <a href="mailto:sales@cemalengineering.com?subject=${subject}&body=${body}">Click here to send via your email app</a> or email us directly.`;
            alertBox.className = "form-alert error";
          }
        })
        .finally(() => {
          if (btn) { btn.disabled = false; btn.textContent = "Request Manufacturing Review"; }
        });
    }

    function escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        if (alertBox) {
          alertBox.textContent = "File is too large. Maximum size is 10 MB. Please send larger files via email.";
          alertBox.className = "form-alert error";
        }
        return;
      }
      const reader = new FileReader();
      reader.onload = function (e) {
        const base64 = e.target.result.split(",")[1];
        data.attachment = {
          filename: file.name,
          content: base64
        };
        doSubmit(data);
      };
      reader.onerror = function () {
        if (alertBox) {
          alertBox.textContent = "Could not read the attached file. Please try again or send it via email.";
          alertBox.className = "form-alert error";
        }
      };
      reader.readAsDataURL(file);
    } else {
      doSubmit(data);
    }
  });
}

window.addEventListener("resize", resize);
window.addEventListener("scroll", scheduleSceneUpdate, { passive: true });
window.addEventListener("mousemove", handleHeaderReveal, { passive: true });

resize();
setSceneFromScroll();
setupMagneticTargets();
requestAnimationFrame(animate);
