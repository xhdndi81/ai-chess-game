package com.chess.ai.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class AIRequest {
    private String fen;
    private String turn;
    private String userName;
}

