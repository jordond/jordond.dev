function splitHeadline() {
  const headline = document.querySelector<HTMLElement>("[data-headline]")
  if (!headline) return
  const lines = headline.querySelectorAll<HTMLElement>("[data-split]")
  const allChars: HTMLElement[] = []

  lines.forEach((line) => {
    const walk = (node: Node, parent: HTMLElement) => {
      const kids = Array.from(node.childNodes)
      kids.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent || ""
          const frag = document.createDocumentFragment()
          for (const char of text) {
            const span = document.createElement("span")
            span.className = "ch"
            if (char === " ") {
              span.setAttribute("data-space", "")
              span.innerHTML = "&nbsp;"
            } else {
              span.textContent = char
            }
            frag.appendChild(span)
            allChars.push(span)
          }
          parent.replaceChild(frag, child)
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement
          if (el.classList.contains("hero__period")) {
            el.classList.add("ch")
            allChars.push(el)
          } else {
            walk(el, el)
          }
        }
      })
    }
    walk(line, line)
  })

  headline.classList.add("is-split", "is-ready")
  attachProximity(headline, allChars)
}

function attachProximity(headline: HTMLElement, chars: HTMLElement[]) {
  let frame = 0
  let targetX = -9999
  let targetY = -9999

  const update = () => {
    frame = 0
    chars.forEach((ch) => {
      const r = ch.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = targetX - cx
      const dy = targetY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const radius = 160
      const influence = Math.max(0, 1 - dist / radius)
      ch.style.setProperty("--d", influence.toFixed(3))
    })
  }

  const onMove = (e: PointerEvent) => {
    targetX = e.clientX
    targetY = e.clientY
    if (!frame) frame = requestAnimationFrame(update)
  }
  const onLeave = () => {
    targetX = -9999
    targetY = -9999
    if (!frame) frame = requestAnimationFrame(update)
  }

  headline.addEventListener("pointermove", onMove)
  headline.addEventListener("pointerleave", onLeave)
}

function runStarCount(reduced: boolean) {
  const el = document.querySelector<HTMLElement>(".hero__code-body .star-count")
  if (!el) return
  const target = Number(el.dataset.target || "0")
  if (reduced || !target) {
    el.textContent = String(target)
    return
  }
  const duration = 1100
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - t, 3)
    el.textContent = String(Math.round(target * eased))
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

export function initHero() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const run = () => {
    splitHeadline()
    runStarCount(reduced)
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run)
  } else {
    run()
  }
}
