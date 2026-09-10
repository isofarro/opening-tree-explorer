# Application Summary: Opening Tree Explorer

This is a **Next.js + TypeScript + TailwindCSS** web application designed as an **advanced chess opening explorer and analysis tool**. It integrates with external APIs to present opening databases and engine analysis data alongside an interactive chess board.

## Core Functionality

### 1. Interactive Chess Board
- Renders a full chess board using the `chessground` library via a custom React wrapper (`src/third-party/react-chessground/Chessground.tsx`).
- Users can make moves by clicking or dragging pieces (legal moves are highlighted and restricted via the `toDests` function).
- Supports flipping the board orientation between white and black perspective via a "Flip Board" button.

### 2. Opening Tree / Database Explorer
- Allows users to select from multiple available opening databases (e.g. `twic-2025`, `twic-2026`) via a dropdown selector (`src/features/opening-trees/components/TreeSelector.tsx`).
- For each position reached on the board, it queries the opening tree API to show the most common continuations from that position.
- Move transitions are managed using a custom `ChessMoveGraph` class for navigating move history.

### 3. Opening Move Statistics Table
- For the current position, it displays a detailed table of candidate moves (`src/features/opening-trees/components/PositionTable.tsx`) showing:
  - Move notation
  - Number of games where the move was played
  - Win / Draw / Loss percentage bar graph
  - Average rating of players who played the move
  - Performance rating delta (difference between the average opponent rating and result)
  - Last played date

### 4. Notation Pane / Move History
- Shows the algebraic notation of all moves played in the current game tree.
- Users can click on any move in the history to jump back to that position.

### 5. Cloud Engine Analysis (Pre-computed)
- Displays a pre-computed analysis grid from multiple chess engines stored in the analysis API.
- Shows a grid with Engine Name | Best Move | Score / Depth (formatted as pawn advantage or mate score).

### 6. Local Engine Analysis (Stockfish via Web Worker)
- Integrates a Web Worker-based Stockfish engine UCI protocol implementation for live, on-demand analysis.
- Provides a "Start Analysis" / "Stop Analysis" control with status indicators.
- Streams analysis results including principal variation, depth, and score.

## Data Sources & APIs

The application interfaces with two primary external micro-services configured in `src/api/services.ts`:

### 1. Opening Trees API (`https://trees.api.chessiq.net`)
- Fetches available tree/database names.
- Fetches position-specific move statistics from a specific database (e.g. `twic-2026`) given a FEN position.
- Response type: `OpeningTreePositionResponse` which contains array of moves with `total_games`, `white_wins`, `draws`, `black_wins`, `rating`, `performance`, `last_played_date`, etc. (see `src/api/opening-trees/types.ts`).

### 2. Analysis API (`https://analysis.api.chessiq.net`)
- Fetches pre-computed engine analysis for a FEN position.
- Response type: `EngineAnalysisData[]` which includes `engine`, `bestMove`, `score`, `mate`, `depth`, `time`, `bestMoves`.
- This powers the "Cloud Analysis" grid under the board.

### 3. Local Chess Logic
- Uses the `chess.ts` library for move validation, FEN manipulation, and local game state management.
- Uses a custom graph data structure (`ChessMoveGraph`) for storing and traversing the move tree.

## Architecture

The application follows a standard modern React structure:
- `features/` — Vertical feature slices (`explorer`, `opening-trees`, `move-pane`, `analysis`, `engine-analysis`).
- `core/` — Domain logic (chess graph, engine/UCI protocol, constants, types).
- `api/` — API client layer, service configuration, and typed API wrappers.
- Uses `@tanstack/react-query` for data fetching and caching of API responses.
- Uses Vitest for testing engine protocol parsing and other core logic.
