import type { OpeningTreeMove, OpeningTreePosition, OpeningTreePositionResponse } from './types';

export const transformToOpeningTreePosition = (
    posResp: OpeningTreePositionResponse
): OpeningTreePosition => {
    return {
        fen: posResp.fen,
        moves: posResp.moves.map((move) => {
            return {
                move: move.move,
                fen: move.fen,
                totalGames: move.total_games,
                whiteWins: move.white_wins,
                draws: move.draws,
                blackWins: move.black_wins,
                rating: move.rating,
                performance: move.performance,
                lastPlayedDate: move.last_played_date,
                gameRef: move.game_ref,
            } as OpeningTreeMove;
        }),
    };
};
