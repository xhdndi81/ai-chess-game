package com.chess.ai.dto;

public class MoveDto {
    private Long roomId;
    private String from;
    private String to;
    private String promotion; // 'q', 'r', 'b', 'n' 또는 null
    private String fen;      // 이동 후의 FEN 상태
    private String turn;     // 다음 차례 ('w' 또는 'b')

    public MoveDto() {}

    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }
    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }
    public String getPromotion() { return promotion; }
    public void setPromotion(String promotion) { this.promotion = promotion; }
    public String getFen() { return fen; }
    public void setFen(String fen) { this.fen = fen; }
    public String getTurn() { return turn; }
    public void setTurn(String turn) { this.turn = turn; }
}
