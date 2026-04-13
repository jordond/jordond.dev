const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"

function splitHeadline(reduced: boolean) {
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
            // Period is its own "char" — keep as-is, register it.
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

  headline.classList.add("is-split")

  if (reduced) {
    headline.classList.add("is-ready")
    return
  }

  // Per-char reveal via WAAPI. Stagger 22ms.
  allChars.forEach((ch, i) => {
    ch.animate(
      [
        {
          opacity: 0,
          transform: "translateY(0.9em) rotate(-4deg)",
          fontVariationSettings: '"wght" 300',
        },
        {
          opacity: 1,
          transform: "translateY(-0.08em) rotate(0deg)",
          fontVariationSettings: '"wght" 900',
          offset: 0.75,
        },
        {
          opacity: 1,
          transform: "translateY(0) rotate(0)",
          fontVariationSettings: '"wght" 800',
        },
      ],
      {
        duration: 1100,
        delay: 180 + i * 22,
        easing: EASE,
        fill: "forwards",
      },
    )
  })

  const settleAt = 180 + allChars.length * 22 + 1100
  window.setTimeout(() => {
    headline.classList.add("is-ready")
    attachProximity(headline, allChars)
  }, settleAt)
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

function revealCodeCard(reduced: boolean) {
  const body = document.querySelector<HTMLElement>(".hero__code-body")
  if (!body) return
  const lines = Array.from(body.querySelectorAll<HTMLElement>(".cl"))
  if (!lines.length) return

  // Split every text node inside each line into per-char <i class="tc"> spans.
  const lineChars: HTMLElement[][] = []
  lines.forEach((line) => {
    const chars: HTMLElement[] = []
    const split = (node: Node) => {
      const kids = Array.from(node.childNodes)
      kids.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent || ""
          if (!text) return
          const frag = document.createDocumentFragment()
          for (const c of text) {
            const i = document.createElement("i")
            i.className = "tc"
            i.textContent = c
            frag.appendChild(i)
            chars.push(i)
          }
          child.parentNode?.replaceChild(frag, child)
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          split(child)
        }
      })
    }
    split(line)
    lineChars.push(chars)
  })

  if (reduced) {
    lineChars.flat().forEach((c) => c.classList.add("is-typed"))
    runStarCount(body, 0, reduced)
    return
  }

  // Wait for headline to settle, then type line-by-line, char-by-char.
  let t = 850
  const fastMs = 3.3
  const slowMs = 8.7
  const commaPause = 13
  const linePause = 18
  let lastCaret: HTMLElement | null = null

  const setCaret = (ch: HTMLElement) => {
    if (lastCaret) lastCaret.classList.remove("is-caret")
    ch.classList.add("is-caret")
    lastCaret = ch
  }

  lineChars.forEach((chars) => {
    let leading = true
    chars.forEach((ch) => {
      const text = ch.textContent || ""
      const isWs = /\s/.test(text)
      if (leading && isWs) {
        window.setTimeout(() => ch.classList.add("is-typed"), t)
        return
      }
      leading = false
      let step = fastMs
      if (text === "." || text === "," || text === "(") step = slowMs
      step += Math.random() < 0.08 ? 13 : 0
      t += step
      window.setTimeout(() => {
        ch.classList.add("is-typed")
        setCaret(ch)
      }, t)
      if (text === "," || text === ")") t += commaPause
    })
    t += linePause
  })

  window.setTimeout(() => {
    if (lastCaret) lastCaret.classList.remove("is-caret")
    runStarCount(body, 180, reduced)
  }, t + 120)
}

function runStarCount(root: HTMLElement, delay: number, reduced: boolean) {
  const el = root.querySelector<HTMLElement>(".star-count")
  if (!el) return
  const target = Number(el.dataset.target || "0")
  if (reduced || !target) {
    el.textContent = String(target)
    return
  }
  const duration = 1100
  const start = performance.now() + delay
  const tick = (now: number) => {
    if (now < start) {
      requestAnimationFrame(tick)
      return
    }
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
    splitHeadline(reduced)
    revealCodeCard(reduced)
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run)
  } else {
    run()
  }
}
