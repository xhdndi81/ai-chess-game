package com.chess.ai.controller;

import com.chess.ai.entity.GameHistory;
import com.chess.ai.entity.User;
import com.chess.ai.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @PostMapping("/login")
    public User login(@RequestBody Map<String, String> request) {
        return userService.loginOrRegister(request.get("name"));
    }

    @GetMapping("/history/{userId}")
    public List<GameHistory> getHistory(@PathVariable Long userId) {
        return userService.getGameHistory(userId);
    }

    @PostMapping("/history/{userId}")
    public void saveHistory(@PathVariable Long userId, @RequestBody Map<String, Object> request) {
        String resultStr = (String) request.get("result");
        int movesCount = (int) request.get("movesCount");
        userService.saveGameResult(userId, GameHistory.GameResult.valueOf(resultStr.toUpperCase()), movesCount);
    }
}

