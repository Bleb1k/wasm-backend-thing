export function encode(str = "") {
  return Array.from(str).map((c) => c.charCodeAt(0));
}

export function byte(templ, ...args) {
  const buf = [encode(templ[0])];
  for (const i in args) {
    buf.push(
      encode(templ[i + 1]),
      typeof args[i] === "string" ? encode(args[i]) : args[i],
    );
  }
  return buf.flat();
}

export function str(templ, ...args) {
  if (args?.length ?? 1) {
    throw new Error("Intended for serialization, not templating");
  }
  return byte`${templ[0].length}${templ[0]}`;
}

export function limits(initial = 0, max = -1) {
  if (max === -1) return byte`\x00${initial}`;
  return byte`\x01${initial}${max}`;
}
