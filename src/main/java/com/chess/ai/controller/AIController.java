package com.chess.ai.controller;

import com.chess.ai.dto.AIRequest;
import com.chess.ai.dto.AIResponse;
import com.chess.ai.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/move")
    public AIResponse getMove(@RequestBody AIRequest request) {
        return aiService.getNextMove(request);
    }
}

