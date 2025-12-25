package com.chess.ai.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "game_rooms")
public class GameRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_id")
    private User guest;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomStatus status;

    @Column(length = 100)
    private String fen; // 현재 게임 상태 (FEN notation)

    @Column(length = 10)
    private String turn; // 'w' 또는 'b'

    @Column(length = 10)
    private String winner; // 'w', 'b', 'draw' 또는 null

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime startedAt;

    public GameRoom() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getHost() { return host; }
    public void setHost(User host) { this.host = host; }
    public User getGuest() { return guest; }
    public void setGuest(User guest) { this.guest = guest; }
    public RoomStatus getStatus() { return status; }
    public void setStatus(RoomStatus status) { this.status = status; }
    public String getFen() { return fen; }
    public void setFen(String fen) { this.fen = fen; }
    public String getTurn() { return turn; }
    public void setTurn(String turn) { this.turn = turn; }
    public String getWinner() { return winner; }
    public void setWinner(String winner) { this.winner = winner; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public enum RoomStatus {
        WAITING,    // 대기 중
        PLAYING,    // 게임 진행 중
        FINISHED    // 게임 종료
    }
}
