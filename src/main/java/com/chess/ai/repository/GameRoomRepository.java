package com.chess.ai.repository;

import com.chess.ai.entity.GameRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GameRoomRepository extends JpaRepository<GameRoom, Long> {
    List<GameRoom> findByStatusOrderByCreatedAtDesc(GameRoom.RoomStatus status);
    List<GameRoom> findByStatus(GameRoom.RoomStatus status);
}

