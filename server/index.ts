import { readLines } from "https://deno.land/std@0.104.0/io/mod.ts";
import { WebSocketClient, WebSocketServer } from "https://deno.land/x/websocket@v0.1.4/mod.ts";
import { log } from "./logger.ts";

const wss = new WebSocketServer(6969);
const ServerVersion = "1.0.0";

let client: WebSocketClient | undefined;
wss.on("connection", (ws: WebSocketClient) => {
  if(client) return ws.close(66, "Only one client allowed at any given time.");
  log("ws", "g:client connected");
  client = ws;

  ws.on("message", (message: string) => {
    try {
      const json = JSON.parse(message);
      log("ws", "g:received message", `y:${message}`);
      if(json.type === "pos-fen") {
        cat.stdin?.write(new TextEncoder().encode(`stop\n`));
        cat.stdin?.write(new TextEncoder().encode(`position fen ${json.fen}\n`));
        cat.stdin?.write(new TextEncoder().encode(`go infinite searchmoves\n`));
      }
      if(json.type === "pos-tcn") {
        log("ws", "g:received tcn", `y:${json.tcn}`);
        const tcn = tcnToMoves(json.tcn);
        cat.stdin?.write(new TextEncoder().encode(`stop\n`));
        cat.stdin?.write(new TextEncoder().encode(`position startpos moves ${tcn}\n`));
        cat.stdin?.write(new TextEncoder().encode(`go infinite\n`));
      }else if(json.type === "opt-set") {
        cat.stdin?.write(new TextEncoder().encode(`setoption name ${json.name} value ${json.value}\n`));
      }else if(json.type === "pos-fen+tcn") {
        const tcn = tcnToMoves(json.tcn);
        cat.stdin?.write(new TextEncoder().encode(`stop\n`));
        cat.stdin?.write(new TextEncoder().encode(`position fen ${json.fen}\n`));
        cat.stdin?.write(new TextEncoder().encode(`position moves ${tcn}\n`));
        cat.stdin?.write(new TextEncoder().encode(`go infinite searchmoves\n`));
      }else if(json.type === "req-ver") {
        ws.send(JSON.stringify({ type: "res-ver", version: ServerVersion }));
      }
    }catch {
      log(":ws", "r:invalid message", `y:${message}`);
    }
  });

  ws.on("close", () => {
    log("ws", "r:client disconnected");
    cat.stdin?.write(new TextEncoder().encode(`stop\n`));
    client = undefined;
  });
});

type Move = {
  from: string;
  to: string;
  promotion?: string;
  drop?: string;
}
function tcnToMoves(P: string) {
  const T = "pnbrq";
  const Qe = 512;
  const xt = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?{~}(^)[_]@#$,./&-*++=";
  const At = "qnrbkp";
  let oe, Fe = P.length,
    nt: Move[] = [],
    Pe, pt, Vt;
  for (oe = 0; oe < Fe; oe += 2) Vt = {} as Move, Pe = xt.indexOf(P[oe]), pt = xt.indexOf(P[oe + 1]), pt > 63 && (Vt.promotion = At[Math.floor((pt - 64) / 3)], pt = Pe + (Pe < 16 ? -8 : 8) + (pt - 1) % 3 - 1), Pe > 75 ? Vt.drop = At[Pe - 79] : Vt.from = xt[Pe % 8] + (Math.floor(Pe / 8) + 1), Vt.to = xt[pt % 8] + (Math.floor(pt / 8) + 1), nt.push(Vt);
  const tcn = nt.map(n => n.from + n.to + (n.promotion || "")).join(" ");
  return tcn;
}

async function pipeThrough(
  reader: Deno.Reader,
  writer: Deno.Writer,
) {
  // const encoder = new TextEncoder();
  for await (const line of readLines(reader)) {
    if(line.includes("info depth") && line.includes("pv")) {
      const move = line.split(" pv ")[1].split(" ")[0];
      if(!client) continue;
      const pvIndex = (!line.includes("multipv") ? 0 : parseInt(line.split(" multipv ")[1].split(" ")[0])) - 1;
      if(line.includes("score cp")) client.send(JSON.stringify({type: "move", move, pvIndex}));
      if(line.includes("score mate")) client.send(JSON.stringify({type: "mate", move, pvIndex}));
    }
    // console.log(line);
    // console.log(line);
    // await writeAll(writer, encoder.encode(`[${prefix}] ${line}\n`));
    // await cat.stdin?.write(new TextEncoder().encode("uci\n"));
  }
}

const cat = Deno.run({
  cmd: ["stockfish"],
  stdin: "piped",
  stdout: "piped",
  stderr: "piped",
});

pipeThrough(cat.stdout, Deno.stdout);
pipeThrough(cat.stderr, Deno.stderr);