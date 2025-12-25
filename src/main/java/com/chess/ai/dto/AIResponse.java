package com.chess.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AIResponse {
    private String move; // SAN format or from-to format
    private String comment; // Friendly comment for kids
}

