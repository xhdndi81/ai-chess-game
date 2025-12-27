package com.chess.ai.repository;

import com.chess.ai.entity.ChessGameData;
import com.chess.ai.entity.GameRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChessGameDataRepository extends JpaRepository<ChessGameData, Long> {
    Optional<ChessGameData> findByRoom(GameRoom room);
    Optional<ChessGameData> findByRoomId(Long roomId);
}

