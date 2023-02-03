import * as clr from "https://deno.land/std@0.123.0/fmt/colors.ts";

const m: {[key: string]: (str: string)=>string} = {
  r: clr.red,
  br: clr.brightRed,
  g: clr.green,
  bg: clr.brightGreen,
  y: clr.yellow,
  by: clr.brightYellow,
  m: clr.magenta,
  bm: clr.brightMagenta,
  c: clr.cyan,
  bc: clr.brightCyan,
  w: clr.white,
  bw: clr.brightWhite,
  b: clr.blue,
  bb: clr.brightBlue,
  gr: clr.gray,
  bl: clr.black,
}

/**
 * r:red g:green y:yellow m:magenta c:cyan w:white b:blue gr:gray bl:black
 */
export const log = (from: string, ...rest: string[]) => {
  const now = new Date();
  console.log(
    clr.white(`[${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}]`),
    from[0] === ":" ? clr.bgBrightMagenta(" " + clr.black(from.slice(1)) + " ") + m.bm(" ~ ") : clr.brightMagenta(`${from} ~`),
    ...rest.map((str) => {
      if(Object.keys(m).includes(str.split(":")[0])) {
        const [color, ...rest] = str.split(":");
        return m[color](rest.join(":"));
      }
      return m["bm"](str);
    })
  );
}