package com.chess.ai.repository;

import com.chess.ai.entity.GameHistory;
import com.chess.ai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GameHistoryRepository extends JpaRepository<GameHistory, Long> {
    List<GameHistory> findByUserOrderByPlayedAtDesc(User user);
}

