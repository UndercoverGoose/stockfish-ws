(() => {
  const ClientVersion = "1.0.0";
  const notify = (msg, dur = 5000) => {
    alert(msg);
  };
  if(window.sfrunning) return notify("Stockfish is already running.");
  const canvas = document.querySelector("chess-board");
  if(!canvas) return notify("No canvas found. Please refresh the page.");
  window.sfrunning = true;
  const board = document.createElement("div");
  board.classList.add("stockfish-board");
  board.style.position = "fixed";
  board.style.pointerEvents = "none";
  const styling = document.createElement("style");
  styling.innerHTML = `.stockfish-arrow-head {
    position: absolute;
    display: block;
    background: inherit;
    clip-path: circle();
  }`;
  document.head.appendChild(styling);
  const innerBoard = document.createElement("div");
  innerBoard.style = "position: relative; width: 100%; height: 100%; pointerEvents: none;";
  board.appendChild(innerBoard);
  document.body.appendChild(board);
  const ws = new WebSocket("ws://localhost:6969");
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if(data.type === "move" || data.type === "mate") {
      const move = data.move;
      const [from, to] = coordMap(move);
      clearArrows(data.pvIndex);
      drawArrow(from, to, Math.max(10 - 2 * data.pvIndex, 2), data.type === "move" ? "black" : "#fc3d2f", data.pvIndex);
    }else if(data.type === "res-ver") {
      if(ClientVersion !== data.version) {
        notify("Stockfish server is not up to date. Update the server for full functionality.\nhttps://github.com/UndercoverGoose/stockfish-ws");
      }
    }
  };
  ws.onclose = () => {};
  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: "req-ver"
    }));
  };
  const onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data)[0].data;
      if(parsed.tid !== "GameState") return;
      clearArrows();
      ws.send(JSON.stringify({
        type: "pos-tcn",
        tcn: parsed.game.moves
      }));
      const isWhite = parsed.game.players[0].uid === context.user.username;
      if(!isWhite) board.style.transform = "rotate(180deg)";
      else board.style.transform = "rotate(0deg)";
    }catch {
    }
  };
  const getTopBot = (start, end) => {
    if(start[1] < end[1]) return [start, end];
    if(start[1] > end[1]) return [end, start];
    if(start[0] < end[0]) return [start, end];
    return [end, start];
  };
  const drawArrow = (from, to, thickness, color, pv) => {
    const scale = board.offsetWidth / 8;
    const [start, end] = getTopBot(from, to);
    const width = end[0] - start[0];
    const height = Math.abs(start[1] - end[1]);
    const hypot = Math.hypot(width, height);
    const angle = Math.atan2(height, width) * 180 / Math.PI;
    const arrow = document.createElement("div");
    arrow.classList.add("stockfish-arrow");
    arrow.style.height = thickness + "px";
    arrow.style.opacity = thickness / 10;
    arrow.style.width = hypot * scale + "px";
    arrow.style.transform = `rotate(${angle}deg)`;
    arrow.style.top = (start[1] + end[1]) / 2 * scale - thickness/2 + scale/2 + "px";
    arrow.style.left = (start[0] + end[0]) / 2 * scale - (hypot * scale) / 2 + scale/2 + "px";
    arrow.style.pointerEvents = "none";
    arrow.style.background = color;
    arrow.style.position = "absolute";
    arrow.style.zIndex = 69420 - pv;
    arrow.setAttribute("pv", pv);
    arrow.setAttribute("from", from);
    arrow.setAttribute("to", to);
    arrow.setAttribute("thickness", thickness);
    arrow.setAttribute("color", color);
    const arrowHead = document.createElement("div");
    arrowHead.classList.add("stockfish-arrow-head");
    arrowHead.style = `background: ${color}; top: ${to[1] * scale}px; left: ${to[0] * scale}px; width: ${scale}px; height: ${scale}px; transform: scale(0.3) rotate(${angle - 180}deg);`;
    arrowHead.setAttribute("pv", pv);
    innerBoard.appendChild(arrowHead);
    innerBoard.appendChild(arrow);
  };
  const clearArrows = (pv) => {
    if(pv) {
      document.querySelector(`.stockfish-arrow[pv='${pv}']`)?.remove();
      document.querySelector(`.stockfish-arrow-head[pv='${pv}']`)?.remove();
      return;
    }
    document.querySelectorAll(".stockfish-arrow").forEach((arrow) => {
      arrow.remove();
    });
    document.querySelectorAll(".stockfish-arrow-head").forEach((arrow) => {
      arrow.remove();
    });
  };
  const regenArrows = () => {
    const arrows = [];
    document.querySelectorAll(".stockfish-arrow").forEach((arrow) => {
      arrows.push([
        arrow.getAttribute("from").split(",").map((x) => parseInt(x)),
        arrow.getAttribute("to").split(",").map((x) => parseInt(x)),
        parseInt(arrow.getAttribute("thickness")),
        arrow.getAttribute("color"),
        parseInt(arrow.getAttribute("pv"))
      ]);
    });
    clearArrows();
    arrows.forEach((arrow) => {
      drawArrow(...arrow);
    });
  };
  const cvOverlay = () => {
    const { top, left } = canvas.getBoundingClientRect();
    board.style.width = canvas.offsetWidth + "px";
    board.style.height = canvas.offsetHeight + "px";
    board.style.top = top + "px";
    board.style.left = left + "px";
    regenArrows();
  };
  cvOverlay();
  const coordMap = (move) => {
    const rows = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const columns = [8, 7, 6, 5, 4, 3, 2, 1];
    const from = [rows.indexOf(move[0]), columns.indexOf(parseInt(move[1]))];
    const to = [rows.indexOf(move[2]), columns.indexOf(parseInt(move[3]))];
    return [from, to];
  };
  window.onresize = cvOverlay;
  window.onscroll = cvOverlay;

  let localPv = 1, flipped = false;
  let localPlayingAs = "white";
  window.addEventListener("keypress", event => {
    if(event.key === "=") {
      const oldPv = localPv;
      localPv += 1;
      ws.send(JSON.stringify({
        type: "opt-set",
        name: "MultiPV",
        value: localPv
      }));
      clearArrows(oldPv);
    }else if(event.key === "-") {
      localPv = Math.max(1, localPv - 1);
      ws.send(JSON.stringify({
        type: "opt-set",
        name: "MultiPV",
        value: localPv
      }));
    }else if(event.key === "f") {
      flipped = !flipped;
      if(flipped) board.style.transform = "rotate(180deg)";
      else board.style.transform = "rotate(0deg)";
    }
  });
  let localTCN = null;
  setInterval(() => {
    if(location.href.includes("puzzle") || location.href.includes("analysis")) {
      try {
        const cboard = document.querySelector("chess-board");
        const fen = cboard.game.getFEN();
        const tcn = cboard.game.getTCN();
        if(localTCN === tcn) return;
        localTCN = tcn;
        ws.send(JSON.stringify({
          type: "pos-fen+tcn",
          fen, tcn
        }));
        const previous = localPlayingAs;
        localPlayingAs = cboard.game.getPlayingAs() === 2 ? "black" : "white";
        if(localPlayingAs !== previous) {
          if(localPlayingAs === "black") board.style.transform = "rotate(180deg)";
          else board.style.transform = "rotate(0deg)";
        }
      }catch {}
    }
    if(!window.game) return;
    if(game.getPlayingAs) {
      const previous = localPlayingAs;
      localPlayingAs = game.getPlayingAs() === 2 ? "black" : "white";
      if(localPlayingAs !== previous) {
        if(localPlayingAs === "black") board.style.transform = "rotate(180deg)";
        else board.style.transform = "rotate(0deg)";
      }
    }
    if(!game.getTCN) return;
    const tcn = game.getTCN();
    if(localTCN !== tcn) {
      ws.send(JSON.stringify({
        type: "pos-tcn", tcn
      }));
      localTCN = tcn;
    }
  }, 100);

  WebSocket.prototype.SENT = WebSocket.prototype.send;
  WebSocket.prototype.send = function(data) {
    this.removeEventListener("message", onmessage);
    this.addEventListener("message", onmessage);
    this.SENT(data);
  };
})()