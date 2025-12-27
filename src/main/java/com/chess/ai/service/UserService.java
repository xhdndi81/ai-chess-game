package com.chess.ai.service;

import com.chess.ai.entity.GameHistory;
import com.chess.ai.entity.User;
import com.chess.ai.repository.GameHistoryRepository;
import com.chess.ai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final GameHistoryRepository gameHistoryRepository;

    public UserService(UserRepository userRepository, GameHistoryRepository gameHistoryRepository) {
        this.userRepository = userRepository;
        this.gameHistoryRepository = gameHistoryRepository;
    }

    @Transactional
    public User loginOrRegister(String name) {
        return userRepository.findByName(name)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setName(name);
                    return userRepository.save(newUser);
                });
    }

    public List<GameHistory> getGameHistory(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return gameHistoryRepository.findByUserOrderByPlayedAtDesc(user);
    }

    @Transactional
    public void saveGameResult(Long userId, GameHistory.GameResult result, int movesCount, String opponentName, GameHistory.GameType gameType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        GameHistory history = new GameHistory();
        history.setUser(user);
        history.setResult(result);
        history.setGameType(gameType);
        history.setMovesCount(movesCount);
        history.setOpponentName(opponentName);
        gameHistoryRepository.save(history);
    }
}

