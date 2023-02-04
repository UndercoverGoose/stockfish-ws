# stockfish-ws
- Deno server running stockfish engine communicating with browser via websockets to relay the best moves
- Supports fen and tcn move setting
- Supports increasing & decreasing # of pv lines
- Supports all live 1v1 standard chess modes
- Supports playing the computer
- Supports all puzzle modes
- Support analysis

## Installation
1. Install [Deno](https://deno.land/manual@v1.30.2/getting_started/installation)
2. Install [Stockfish CLI](https://stockfishchess.org/download/)
    - Mac & Linux use `brew install stockfish`
    - Windows use WSL to run ubuntu and install stockfish
        - You can use windows natively but you will need to install and add stockfish to your path
3. Verify stockfish is installed by running `stockfish` in terminal
4. Download this repository
5. Run `deno task run` while in the root of this repository
    - `cd <path_to_repo>`
    - Running with WSL: `cd /mnt/c/users/<user>/<path_to_repo>`
        - Recommend cloning the repository to the ubuntu environment
6. Open your preferred browser and navigate to [chess.com](https://www.chess.com/)
7. Start a live game and run the bookmark from below

## Bookmark
```js
javascript:(()=>{const s=document.createElement("script");s.src="https://undercovergoose.github.io/stockfish-ws/bookmark.js";document.body.appendChild(s)})();void 0
```

## Usage
- The script only works if you activate while in a game
- Pressing `-` will decrease the number of pv lines
- Pressing `=` (+ key) will increase the number of pv lines
- Pressing `f` will flip the orientation of the pv lines
    - Needed if the script fails to detect which side you are playing on