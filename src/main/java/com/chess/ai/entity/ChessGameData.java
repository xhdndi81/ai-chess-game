package com.chess.ai.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "chess_game_data")
public class ChessGameData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false, unique = true)
    private GameRoom room;

    @Column(length = 100)
    private String fen; // 현재 게임 상태 (FEN notation)

    @Column(length = 10)
    private String turn; // 'w' 또는 'b'

    @Column(length = 10)
    private String winner; // 'w', 'b', 'draw' 또는 null

    public ChessGameData() {}

    public ChessGameData(GameRoom room, String fen, String turn) {
        this.room = room;
        this.fen = fen;
        this.turn = turn;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public GameRoom getRoom() { return room; }
    public void setRoom(GameRoom room) { this.room = room; }
    public String getFen() { return fen; }
    public void setFen(String fen) { this.fen = fen; }
    public String getTurn() { return turn; }
    public void setTurn(String turn) { this.turn = turn; }
    public String getWinner() { return winner; }
    public void setWinner(String winner) { this.winner = winner; }
}

