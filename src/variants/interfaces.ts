export interface ExtendedMoveInfo {
  san: string;
  uci: string;
  fen: string;
  prevFen: string;
}

export interface ParsedMove {
  dest: string;
  orig: string;
}
