package com.chess.ai.dto;

public class AIRequest {
    private String fen;
    private String turn;
    private String userName;

    public AIRequest() {}

    public String getFen() { return fen; }
    public void setFen(String fen) { this.fen = fen; }
    public String getTurn() { return turn; }
    public void setTurn(String turn) { this.turn = turn; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
}
