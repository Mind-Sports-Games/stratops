# Graph Report - . (2026-05-20)

## Corpus Check

- Corpus is ~48,735 words - fits in a single context window. You may not need a graph.

## Summary

- 1179 nodes · 2624 edges · 56 communities (37 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)

- [[_COMMUNITY_Core Variant Position API|Core Variant Position API]]
- [[_COMMUNITY_Draughts Move Notation|Draughts Move Notation]]
- [[_COMMUNITY_Bitboard SquareSet Operations|Bitboard SquareSet Operations]]
- [[_COMMUNITY_Abalone FEN Parsing|Abalone FEN Parsing]]
- [[_COMMUNITY_SquareSet Unit Tests|SquareSet Unit Tests]]
- [[_COMMUNITY_FEN Sequence Test Fixtures|FEN Sequence Test Fixtures]]
- [[_COMMUNITY_Strategy Game Constructors|Strategy Game Constructors]]
- [[_COMMUNITY_Position Hashing|Position Hashing]]
- [[_COMMUNITY_Board Class Core|Board Class Core]]
- [[_COMMUNITY_FEN Parser Utilities|FEN Parser Utilities]]
- [[_COMMUNITY_Variant Interface Methods|Variant Interface Methods]]
- [[_COMMUNITY_Draughts Variants|Draughts Variants]]
- [[_COMMUNITY_Othello Variants|Othello Variants]]
- [[_COMMUNITY_Abalone Variant Classes|Abalone Variant Classes]]
- [[_COMMUNITY_Chess Attack Computation|Chess Attack Computation]]
- [[_COMMUNITY_Chess Position Validation|Chess Position Validation]]
- [[_COMMUNITY_Multi-Variant Notation|Multi-Variant Notation]]
- [[_COMMUNITY_Amazons Game Tests|Amazons Game Tests]]
- [[_COMMUNITY_Shogi Drop Move Notation|Shogi Drop Move Notation]]
- [[_COMMUNITY_Bestemshe Variant|Bestemshe Variant]]
- [[_COMMUNITY_Go Variant|Go Variant]]
- [[_COMMUNITY_Lines of Action + GameFamily|Lines of Action + GameFamily]]
- [[_COMMUNITY_Backgammon Notation|Backgammon Notation]]
- [[_COMMUNITY_Chessground Compat Layer|Chessground Compat Layer]]
- [[_COMMUNITY_MiniShogi Move Tests|MiniShogi Move Tests]]
- [[_COMMUNITY_Attack Test Suite|Attack Test Suite]]
- [[_COMMUNITY_SAN Notation Tests|SAN Notation Tests]]
- [[_COMMUNITY_Chess Castling Tests|Chess Castling Tests]]
- [[_COMMUNITY_RacingKings Variant|RacingKings Variant]]
- [[_COMMUNITY_Antichess Variant|Antichess Variant]]
- [[_COMMUNITY_Atomic Chess Variant|Atomic Chess Variant]]
- [[_COMMUNITY_LinesOfAction Variant|LinesOfAction Variant]]
- [[_COMMUNITY_Castling Mechanics|Castling Mechanics]]
- [[_COMMUNITY_Horde Variant|Horde Variant]]
- [[_COMMUNITY_FiveCheck Variant|FiveCheck Variant]]
- [[_COMMUNITY_Chessground Compat Tests|Chessground Compat Tests]]
- [[_COMMUNITY_Xiangqi Tests|Xiangqi Tests]]
- [[_COMMUNITY_Position Outcome Helpers|Position Outcome Helpers]]
- [[_COMMUNITY_KingOfTheHill Variant|KingOfTheHill Variant]]
- [[_COMMUNITY_ThreeCheck Variant|ThreeCheck Variant]]
- [[_COMMUNITY_Monster Chess Variant|Monster Chess Variant]]
- [[_COMMUNITY_Variant Perft Tests|Variant Perft Tests]]
- [[_COMMUNITY_MiniBreakthrough Variant|MiniBreakthrough Variant]]
- [[_COMMUNITY_Crazyhouse Variant|Crazyhouse Variant]]
- [[_COMMUNITY_Board FEN Init Helpers|Board FEN Init Helpers]]
- [[_COMMUNITY_AntiOthello Variant|AntiOthello Variant]]
- [[_COMMUNITY_Xiangqi Variant|Xiangqi Variant]]
- [[_COMMUNITY_Amazons Variant|Amazons Variant]]
- [[_COMMUNITY_GrandOthello Variant|GrandOthello Variant]]
- [[_COMMUNITY_Breakthrough Variant|Breakthrough Variant]]
- [[_COMMUNITY_NoCastling Variant|NoCastling Variant]]
- [[_COMMUNITY_ScrambledEggs Variant|ScrambledEggs Variant]]
- [[_COMMUNITY_Position FEN Integration Tests|Position FEN Integration Tests]]
- [[_COMMUNITY_Shogi Variant|Shogi Variant]]
- [[_COMMUNITY_Chess Variant|Chess Variant]]
- [[_COMMUNITY_Backgammon Dice Helpers|Backgammon Dice Helpers]]

## God Nodes (most connected - your core abstractions)

1. `SquareSet` - 100 edges
2. `RULES` - 55 edges
3. `Board` - 46 edges
4. `defined()` - 45 edges
5. `opposite()` - 42 edges
6. `Setup` - 32 edges
7. `PlayerIndex` - 29 edges
8. `PositionError` - 29 edges
9. `BoardDimensions` - 27 edges
10. `Context` - 21 edges

## Surprising Connections (you probably didn't know these)

- `charToPiece()` --calls--> `charToRole()` [EXTRACTED]
  fen.ts → util.ts
- `readFen_board()` --calls--> `charToPiece()` [EXTRACTED]
  variants/abalone/GameFamily.ts → fen.ts
- `parseRemainingChecks()` --calls--> `defined()` [EXTRACTED]
  fen.ts → util.ts
- `toFen()` --calls--> `makeFen()` [EXTRACTED]
  variants/Variant.ts → fen.ts
- `linesOfActionAttacks()` --calls--> `zip()` [EXTRACTED]
  attacks.ts → fp.ts

## Communities (56 total, 19 thin omitted)

### Community 0 - "Core Variant Position API"

Cohesion: 0.05
Nodes (70): clone(), fixFenForLastAction(), getPiecesCoordinates(), indexToAlgebraic(), readFen(), toSetup(), fixFenForEp(), getEnPassantOptions() (+62 more)

### Community 1 - "Draughts Move Notation"

Cohesion: 0.05
Nodes (62): computeMoveNotation(), computeMoveNotation_unknown(), computeMoveNotationCore(), computeMoveNotationCore_jump(), computeMoveNotationCore_line(), fenSetupFromTuple(), getCellList(), getCentre() (+54 more)

### Community 2 - "Bitboard SquareSet Operations"

Cohesion: 0.05
Nodes (5): bitPartMap(), bswap32(), popcnt32(), rbit32(), SquareSet

### Community 3 - "Abalone FEN Parsing"

Cohesion: 0.05
Nodes (19): AbaloneBoardWriter, abaloneBoardWriters, AbaloneSetupParser, abaloneSetupParsers, BoardAndOptPockets, BoardAndPockets, charToPiece(), COMMA_FEN_RULES (+11 more)

### Community 4 - "SquareSet Unit Tests"

Cohesion: 0.04
Nodes (44): amazonsSet, bswap, centers10, centers9x10, complement7, complement9x10, corners7, corners9x10 (+36 more)

### Community 5 - "FEN Sequence Test Fixtures"

Cohesion: 0.04
Nodes (44): board, fen, fenAfterEighthAction, fenAfterEleventhAction, fenAfterFifthAction, fenAfterFirstAction, fenAfterFourthAction, fenAfterNinthAction (+36 more)

### Community 6 - "Strategy Game Constructors"

Cohesion: 0.07
Nodes (11): Backgammon, Hyper, Dameo, Antidraughts, Brkthru, Frisian, Frysk, International (+3 more)

### Community 7 - "Position Hashing"

Cohesion: 0.07
Nodes (11): fxhash128(), fxhash32(), hashBoard(), hashMaterial(), hashMaterialSide(), hashRemainingChecks(), hashSetup(), rol32() (+3 more)

### Community 8 - "Board Class Core"

Cohesion: 0.1
Nodes (8): Board, flipDiagonal(), flipHorizontal(), flipVertical(), rotate180(), r, transformBoard(), transformSetup()

### Community 9 - "FEN Parser Utilities"

Cohesion: 0.08
Nodes (17): BoardAndPocketStrings, InvalidFen, parseBoardAndOptPockets(), parseCastlingFen(), parseFenSquare(), parseLastMove(), parseRemainingChecksOpt(), clone() (+9 more)

### Community 10 - "Variant Interface Methods"

Cohesion: 0.09
Nodes (11): clone(), isPlayerIndexConnected(), isVariantEnd(), toSetup(), variantOutcome(), flipPieces(), isVariantEnd(), play() (+3 more)

### Community 11 - "Draughts Variants"

Cohesion: 0.1
Nodes (7): Brazilian, English, Pool, Portuguese, Russian, BoardDimensions, GameFamilyKey

### Community 12 - "Othello Variants"

Cohesion: 0.09
Nodes (10): OctagonOthello, Othello, ExtendedMoveInfo, File, files, Key, LegacyNotationBoard, LexicalUci (+2 more)

### Community 13 - "Abalone Variant Classes"

Cohesion: 0.08
Nodes (8): Abalone, GrandAbalone, actions, backgammonGameFamily, board, move, notation, gameFamilyClass()

### Community 14 - "Chess Attack Computation"

Cohesion: 0.16
Nodes (22): ANTI_DIAG_RANGE, attacks(), bishopAttacks(), computeRange(), DIAG_RANGE, FILE_RANGE, fileAttacks(), hyperbola() (+14 more)

### Community 15 - "Chess Position Validation"

Cohesion: 0.17
Nodes (10): validate(), Chess, clone(), equalsIgnoreMoves(), isCheck(), kingAttackers(), legalEpSquare(), toSetup() (+2 more)

### Community 16 - "Multi-Variant Notation"

Cohesion: 0.11
Nodes (8): hasInsufficientMaterial(), isInsufficientMaterial(), outcome(), computeMoveNotation(), getScoreFromFen(), nextAsciiLetter(), NotationStyle, VariantKey

### Community 17 - "Amazons Game Tests"

Cohesion: 0.09
Nodes (21): amazonsClass, amazonsPosition, board, fen, fenAfterFirstAction, fenAfterFourthAction, fenAfterSecondAction, fenAfterThirdAction (+13 more)

### Community 18 - "Shogi Drop Move Notation"

Cohesion: 0.15
Nodes (12): clone(), computeMoveNotation(), fromSetupAndPos(), getRoleFromFenAt(), isCapture(), isDrop(), isMoveAmbiguous(), patchFairyUci() (+4 more)

### Community 19 - "Bestemshe Variant"

Cohesion: 0.13
Nodes (6): Bestemshe, computeMoveNotation(), getScoreFromFen(), hasTuzdik(), isDestEmptyInTogyFen(), Togyzkumalak

### Community 20 - "Go Variant"

Cohesion: 0.12
Nodes (4): computeMoveNotation(), remapGoDest(), Go19x19, Go9x9

### Community 21 - "Lines of Action + GameFamily"

Cohesion: 0.16
Nodes (10): between(), fileAttacksWH(), rankAttacksWH(), ray(), rookAttacksWH(), computeMoveNotation(), dests(), kingAttacks() (+2 more)

### Community 22 - "Backgammon Notation"

Cohesion: 0.14
Nodes (6): computeMoveNotation(), getDice(), numberofCapturedPiecesOfPlayer(), outcome(), variantOutcome(), Nackgammon

### Community 23 - "Chessground Compat Layer"

Cohesion: 0.15
Nodes (11): amazonsChessgroundFen(), ChessgroundDestsOpts, makeBoardFen(), makeFen(), game, j1, piece, pieceOrUndef (+3 more)

### Community 24 - "MiniShogi Move Tests"

Cohesion: 0.12
Nodes (12): MiniShogi, kEscapes, kEscapes2, move, move2, move3, move4, pos (+4 more)

### Community 25 - "Attack Test Suite"

Cohesion: 0.12
Nodes (16): bishopAttacksWH(), allies, attacks, bishop, enemies, LoaMoveTest, move, moves (+8 more)

### Community 26 - "SAN Notation Tests"

Cohesion: 0.12
Nodes (15): makeSan(), makeSanAndPlay(), makeSanVariation(), line, makeSan, move, moves, parseSan (+7 more)

### Community 27 - "Chess Castling Tests"

Cohesion: 0.14
Nodes (13): altQueenSide, castles, e4, insufficientMaterial, kd1, move, pos, queenSide (+5 more)

### Community 31 - "LinesOfAction Variant"

Cohesion: 0.17
Nodes (7): LinesOfAction, actual, expected, move, moves, pos, parseSan()

### Community 32 - "Castling Mechanics"

Cohesion: 0.22
Nodes (8): castlingSide(), dropDests(), isLegal(), normalizeMove(), play(), playCaptureAt(), rookCastlesTo(), kingCastlesTo()

### Community 35 - "Chessground Compat Tests"

Cohesion: 0.22
Nodes (8): chessgroundDests(), scalachessCharPair(), charPair, dests, pos, setup, uci, parseUci()

### Community 36 - "Xiangqi Tests"

Cohesion: 0.22
Nodes (3): MiniXiangqi, kingMoves, rank

### Community 37 - "Position Outcome Helpers"

Cohesion: 0.39
Nodes (8): allDests(), ctx(), hasDests(), isCheckmate(), isEnd(), isInsufficientMaterial(), isStalemate(), outcome()

### Community 41 - "Variant Perft Tests"

Cohesion: 0.25
Nodes (7): perft(), draw, insufficientMaterial, p1, p2, pos, variantPerfts

### Community 44 - "Board FEN Init Helpers"

Cohesion: 0.29
Nodes (7): getEmptyBoardFen(), getEmptyEpd(), getEmptyFen(), getInitialBoardFen(), getInitialEpd(), getInitialFen(), getInitialMovesFen()

### Community 52 - "Position FEN Integration Tests"

Cohesion: 0.4
Nodes (5): position, setup, parseFen(), variantClassFromKey(), variantKeyToRules()

### Community 55 - "Backgammon Dice Helpers"

Cohesion: 0.67
Nodes (3): backgammonDice(), backgammonFenParts(), playerScores()

## Knowledge Gaps

- **242 isolated node(s):** `BitPartTarget`, `BitPartTargetHandler`, `CopyParams`, `COMMA_FEN_RULES`, `MANCALA_FEN_VARIANT` (+237 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `SquareSet` connect `Bitboard SquareSet Operations` to `Core Variant Position API`, `Abalone FEN Parsing`, `SquareSet Unit Tests`, `Board Class Core`, `Variant Interface Methods`, `Chess Attack Computation`, `Lines of Action + GameFamily`, `Chessground Compat Layer`, `Attack Test Suite`, `Chess Castling Tests`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Why does `Board` connect `Board Class Core` to `Core Variant Position API`, `Draughts Move Notation`, `Abalone FEN Parsing`, `Position Hashing`, `FEN Parser Utilities`, `Shogi Drop Move Notation`, `ScrambledEggs Variant`, `Chessground Compat Layer`, `Attack Test Suite`, `LinesOfAction Variant`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `Material` connect `Position Hashing` to `Core Variant Position API`, `Abalone FEN Parsing`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `BitPartTarget`, `BitPartTargetHandler`, `CopyParams` to the rest of the system?**
  _242 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Variant Position API` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Draughts Move Notation` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Bitboard SquareSet Operations` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
