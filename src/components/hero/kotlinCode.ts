interface Library {
  name: string
  stargazers_count: number
  html_url: string
}

const line = (inner: string, blank = false) =>
  `<span class="cl${blank ? " cl--blank" : ""}">${inner || " "}</span>`
const kw = (t: string) => `<span class="tok-kw">${t}</span>`
const ty = (t: string) => `<span class="tok-type">${t}</span>`
const prop = (t: string) => `<span class="tok-prop">${t}</span>`
const str = (t: string) => `<span class="tok-str">"${t}"</span>`
const fn = (t: string) => `<span class="tok-fn">${t}</span>`
const bool = (t: string) => `<span class="tok-bool">${t}</span>`
const num = (t: string | number) => `<span class="tok-bool">${t}</span>`
const pn = (t: string) => `<span class="tok-punct">${t}</span>`
const cmt = (t: string) => `<span class="tok-comment">${t}</span>`

const shippedBlock = (items: string[]) =>
  [
    line(
      `  ${kw("val")} ${prop("shipped")} ${pn("=")} ${fn("listOf")}${pn("(")}`,
    ),
    ...items.map((it) => line(`    ${str(it)}${pn(",")}`)),
    line(`  ${pn(")")}`),
  ].join("")

const libraryBlock = (libs: Library[]) =>
  [
    line(
      `  ${kw("val")} ${prop("libraries")} ${pn("=")} ${fn("listOf")}${pn("(")}`,
    ),
    ...libs.map(
      (l) =>
        `<a class="cl cl--lib" href="${l.html_url}" target="_blank" rel="noopener noreferrer" data-tip="${l.name} · ${l.stargazers_count}★">    ${fn("Library")}${pn("(")}${prop("name")} ${pn("=")} ${str(l.name)}${pn(",")} ${prop("stars")} ${pn("=")} ${num(l.stargazers_count)}${pn("),")}</a>`,
    ),
    line(`  ${pn(")")}`),
  ].join("")

export interface BuildKotlinCodeArgs {
  libraries: Library[]
  shipped: string[]
  totalStars: number
}

export function buildKotlinCode({
  libraries,
  shipped,
  totalStars,
}: BuildKotlinCodeArgs): string {
  return [
    line(cmt("// the short version")),
    line(`${kw("data object")} ${ty("Jordon")} ${pn("{")}`),
    line(
      `  ${kw("val")} ${prop("role")} ${pn("=")} ${str("Android / KMP engineer")}`,
    ),
    line(
      `  ${kw("val")} ${prop("based")} ${pn("=")} ${str("London, Ontario, Canada")}`,
    ),
    line(`  ${kw("val")} ${prop("available")} ${pn("=")} ${bool("true")}`),
    line("", true),
    shippedBlock(shipped),
    line("", true),
    libraryBlock(libraries),
    line("", true),
    line(
      `  ${kw("val")} ${prop("totalStars")} ${pn("=")} ${prop("libraries")}${pn(".")}${fn("sumOf")} ${pn("{")} ${kw("it")}${pn(".")}${prop("stars")} ${pn("}")} <span class="tok-comment">// <span class="star-count" data-target="${totalStars}">0</span></span>`,
    ),
    line(pn("}")),
  ].join("")
}
