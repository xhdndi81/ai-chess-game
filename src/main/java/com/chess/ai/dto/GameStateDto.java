package com.chess.ai.dto;

public class GameStateDto {
    private String fen;
    private String turn; // 'w' 또는 'b'
    private String status; // WAITING, PLAYING, FINISHED
    private Boolean isGameOver;
    private String winner; // 'w', 'b', 'draw', 또는 null
    private String hostName;
    private String guestName;

    public GameStateDto() {}

    public GameStateDto(String fen, String turn, String status, Boolean isGameOver, String winner, String hostName, String guestName) {
        this.fen = fen;
        this.turn = turn;
        this.status = status;
        this.isGameOver = isGameOver;
        this.winner = winner;
        this.hostName = hostName;
        this.guestName = guestName;
    }

    public String getFen() { return fen; }
    public void setFen(String fen) { this.fen = fen; }
    public String getTurn() { return turn; }
    public void setTurn(String turn) { this.turn = turn; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getIsGameOver() { return isGameOver; }
    public void setIsGameOver(Boolean isGameOver) { this.isGameOver = isGameOver; }
    public String getWinner() { return winner; }
    public void setWinner(String winner) { this.winner = winner; }
    public String getHostName() { return hostName; }
    public void setHostName(String hostName) { this.hostName = hostName; }
    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }
}
