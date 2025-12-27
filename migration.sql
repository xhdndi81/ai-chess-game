-- DB 구조 개선 마이그레이션 스크립트
-- 기존 GameRoom의 체스 전용 필드를 ChessGameData로 이동

-- 1. game_rooms 테이블에 game_type 컬럼 추가
ALTER TABLE game_rooms ADD COLUMN game_type VARCHAR(20) NOT NULL DEFAULT 'CHESS';

-- 2. chess_game_data 테이블 생성
CREATE TABLE IF NOT EXISTS chess_game_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL UNIQUE,
    fen VARCHAR(100),
    turn VARCHAR(10),
    winner VARCHAR(10),
    FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE
);

-- 3. 기존 game_rooms 데이터를 chess_game_data로 마이그레이션
INSERT INTO chess_game_data (room_id, fen, turn, winner)
SELECT id, fen, turn, winner
FROM game_rooms
WHERE fen IS NOT NULL OR turn IS NOT NULL OR winner IS NOT NULL;

-- 4. game_history 테이블에 game_type 컬럼 추가
ALTER TABLE game_history ADD COLUMN game_type VARCHAR(20) NOT NULL DEFAULT 'CHESS';

-- 5. 기존 game_rooms의 체스 전용 컬럼 제거 (선택사항 - 주의: 데이터 손실)
-- 주의: 이 단계는 마이그레이션이 완료되고 확인된 후에만 실행하세요!
-- ALTER TABLE game_rooms DROP COLUMN fen;
-- ALTER TABLE game_rooms DROP COLUMN turn;
-- ALTER TABLE game_rooms DROP COLUMN winner;

