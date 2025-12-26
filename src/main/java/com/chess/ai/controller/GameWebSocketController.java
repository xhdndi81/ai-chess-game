package com.chess.ai.controller;

import com.chess.ai.dto.GameStateDto;
import com.chess.ai.dto.MoveDto;
import com.chess.ai.service.GameRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
@RequiredArgsConstructor
public class GameWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(GameWebSocketController.class);

    private final GameRoomService gameRoomService;

    @MessageMapping("/game/{roomId}/move")
    @SendTo("/topic/game/{roomId}")
    public GameStateDto handleMove(
            @DestinationVariable Long roomId,
            @Payload MoveDto moveDto,
            SimpMessageHeaderAccessor headerAccessor) {
        try {
            // 헤더에서 userId 추출
            String userIdStr = headerAccessor.getFirstNativeHeader("userId");
            if (userIdStr == null) {
                userIdStr = (String) headerAccessor.getSessionAttributes().get("userId");
            }

            Long userId = userIdStr != null ? Long.parseLong(userIdStr) : null;

            if (userId == null) {
                log.warn("UserId not found in headers or session");
                return null;
            }

            // 차례 확인 및 업데이트 수행
            GameStateDto state = gameRoomService.makeMove(
                    roomId,
                    moveDto.getFrom(),
                    moveDto.getTo(),
                    moveDto.getPromotion(),
                    moveDto.getFen(),
                    moveDto.getTurn(),
                    userId);

            // makeMove 후 최신 상태 반환 (FEN과 Turn이 모두 업데이트된 상태)
            return state;
        } catch (Exception e) {
            log.error("Error handling move", e);
            // 에러 발생 시(예: 차례가 아님) 현재 최신 게임 상태를 브로드캐스트하여 동기화 유도
            try {
                return gameRoomService.getGameState(roomId);
            } catch (Exception ex) {
                return null;
            }
        }
    }

    @MessageMapping("/game/{roomId}/state")
    @SendTo("/topic/game/{roomId}")
    public GameStateDto handleStateUpdate(
            @DestinationVariable Long roomId,
            @Payload GameStateDto stateDto,
            SimpMessageHeaderAccessor headerAccessor) {
        try {
            // 헤더에서 userId 추출
            String userIdStr = headerAccessor.getFirstNativeHeader("userId");
            if (userIdStr == null) {
                userIdStr = (String) headerAccessor.getSessionAttributes().get("userId");
            }

            Long userId = userIdStr != null ? Long.parseLong(userIdStr) : null;

            if (userId == null) {
                log.warn("UserId not found in headers or session");
                return null;
            }

            // 게임 상태 업데이트 (클라이언트에서 검증된 상태를 받아서 저장)
            gameRoomService.updateGameState(
                    roomId,
                    stateDto.getFen(),
                    stateDto.getTurn(),
                    stateDto.getIsGameOver() != null ? stateDto.getIsGameOver() : false,
                    stateDto.getWinner(),
                    stateDto.getStatus());

            // 업데이트된 상태를 모든 클라이언트에 브로드캐스트
            GameStateDto updatedState = gameRoomService.getGameState(roomId);
            log.info("Broadcasting game state update for room {}: FEN={}, Turn={}", roomId, updatedState.getFen(),
                    updatedState.getTurn());
            return updatedState;
        } catch (Exception e) {
            log.error("Error handling state update", e);
            return null;
        }
    }

    @MessageMapping("/game/{roomId}/nudge")
    @SendTo("/topic/game/{roomId}")
    public GameStateDto handleNudge(
            @DestinationVariable Long roomId,
            SimpMessageHeaderAccessor headerAccessor) {
        try {
            // 헤더에서 userId 추출
            String userIdStr = headerAccessor.getFirstNativeHeader("userId");
            if (userIdStr == null) {
                userIdStr = (String) headerAccessor.getSessionAttributes().get("userId");
            }

            Long userId = userIdStr != null ? Long.parseLong(userIdStr) : null;

            if (userId == null) {
                log.warn("UserId not found in headers or session");
                return null;
            }

            // 재촉 메시지 전송 및 반환 (메시지가 포함된 GameStateDto)
            return gameRoomService.sendNudgeMessage(roomId, userId);
        } catch (Exception e) {
            log.error("Error handling nudge", e);
            return null;
        }
    }
}
