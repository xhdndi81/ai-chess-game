// 멀티플레이어 관련 로직 (변수는 app.js에 정의됨)

// WebSocket 연결 함수
function connectWebSocket(roomIdParam) {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    
    // 연결 시 헤더에 userId 포함
    const headers = {
        userId: userId.toString()
    };
    
    stompClient.connect(headers, function(frame) {
        console.log('WebSocket Connected: ' + frame);
        console.log('Subscribing to /topic/game/' + roomIdParam);
        
        // 게임 상태 구독
        stompClient.subscribe('/topic/game/' + roomIdParam, function(message) {
            console.log('Received message:', message.body);
            const gameState = JSON.parse(message.body);
            handleGameStateUpdate(gameState);
        });
    }, function(error) {
        console.error('WebSocket connection error:', error);
    });
}

// 서버로 수 전송
function sendMoveToServer(from, to, promotion) {
    if (!stompClient || !stompClient.connected) {
        console.error('WebSocket not connected');
        alert('서버와 연결이 끊어졌습니다. 페이지를 새로고침해주세요.');
        return;
    }
    
    const currentFen = game.fen();
    const currentTurn = game.turn();
    
    // 보낸 FEN을 기록 (자신이 보낸 메시지 무시용)
    lastSentFen = currentFen;
    
    const headers = {
        userId: userId.toString()
    };
    
    // 수와 함께 현재 게임 상태를 전송
    stompClient.send('/app/game/' + roomId + '/move', headers, JSON.stringify({
        roomId: roomId,
        from: from,
        to: to,
        promotion: promotion,
        fen: currentFen,
        turn: currentTurn
    }));
    
    // 게임 종료 여부 확인 및 추가 업데이트 (필요한 경우)
    if (game.game_over()) {
        updateGameStateOnServer();
    }
}

// 재촉하기 메시지 전송 (쿨다운 적용)
let nudgeCooldownTimer = null;
const NUDGE_COOLDOWN_MS = 5000; // 5초 쿨다운

function sendNudgeToServer() {
    if (!stompClient || !stompClient.connected) {
        console.error('WebSocket not connected');
        return;
    }
    
    // 쿨다운 중이면 무시
    if (nudgeCooldownTimer !== null) {
        console.log('Nudge is on cooldown');
        return;
    }
    
    const headers = {
        userId: userId.toString()
    };
    
    // 재촉 메시지 전송
    stompClient.send('/app/game/' + roomId + '/nudge', headers, JSON.stringify({}));
    
    // 쿨다운 시작
    const btnNudge = $('#btn-nudge');
    btnNudge.prop('disabled', true);
    
    let remainingSeconds = NUDGE_COOLDOWN_MS / 1000;
    const originalText = btnNudge.text();
    btnNudge.text(`⚡ ${remainingSeconds}초`);
    
    nudgeCooldownTimer = setInterval(() => {
        remainingSeconds--;
        if (remainingSeconds > 0) {
            btnNudge.text(`⚡ ${remainingSeconds}초`);
        } else {
            clearInterval(nudgeCooldownTimer);
            nudgeCooldownTimer = null;
            btnNudge.prop('disabled', false);
            btnNudge.text(originalText);
        }
    }, 1000);
}

// 서버에 게임 상태 업데이트 전송
function updateGameStateOnServer() {
    if (!stompClient || !stompClient.connected) {
        console.error('WebSocket not connected for state update');
        return;
    }
    
    const headers = {
        userId: userId.toString()
    };
    
    const currentFen = game.fen();
    const isGameOver = game.game_over();
    let winner = null;
    if (isGameOver) {
        if (game.in_checkmate()) {
            winner = game.turn() === 'w' ? 'b' : 'w';
        } else if (game.in_draw()) {
            winner = 'draw';
        }
    }
    
    // 보낸 FEN을 기록 (자신이 보낸 메시지 무시용)
    lastSentFen = currentFen;
    
    console.log('Sending game state update:', currentFen);
    
    stompClient.send('/app/game/' + roomId + '/state', headers, JSON.stringify({
        fen: currentFen,
        turn: game.turn(),
        status: 'PLAYING',
        isGameOver: isGameOver,
        winner: winner,
        hostName: '',
        guestName: ''
    }));
}

// 서버에서 받은 게임 상태 업데이트
function handleGameStateUpdate(gameState) {
    if (!gameState) return;
    
    console.log('handleGameStateUpdate received:', gameState);
    
    // 메시지가 있으면 표시 (게임 시작 알림, 재촉 메시지 등)
    if (gameState.message) {
        console.log('Game Message:', gameState.message);
        $('#ai-message').text(gameState.message);
        
        // 재촉 메시지인지 확인 (상대방 이름이 포함된 메시지)
        const isNudgeMessage = gameState.message.includes('님,') && 
                               (gameState.message.includes('빨리') || 
                                gameState.message.includes('기다리고') || 
                                gameState.message.includes('생각이') ||
                                gameState.message.includes('빨리빨리'));
        
        if (isNudgeMessage) {
            // 재촉 메시지는 음성으로 출력
            speak(gameState.message);
        } else if (gameState.message.includes('참여') || gameState.message.includes('시작')) {
            speak(gameState.message);
            // 게임 시작 시 상대방 이름 업데이트
            if (gameMode === 'multi') {
                if (isHost && gameState.guestName) {
                    opponentName = gameState.guestName;
                } else if (!isHost && gameState.hostName) {
                    opponentName = gameState.hostName;
                }
            }
            
            // 새 게임 시작 메시지인 경우 보드 초기화
            if (gameState.message.includes('새 게임')) {
                game = new Chess();
                movesCount = 0;
                lastSentFen = null;
                if (gameState.fen) {
                    game.load(gameState.fen);
                }
                board.position(game.fen());
                updateStatus();
                $('#btn-new-game').hide();
            }
        }
    }
    
    // FEN이 있으면 체스판 업데이트
    if (gameState.fen) {
        const currentFen = game.fen();
        const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        
        // 새 게임 시작 (초기 FEN이고 게임이 종료되지 않은 경우)
        if (gameState.fen === INITIAL_FEN && (!gameState.isGameOver && gameState.status !== 'FINISHED')) {
            game = new Chess();
            movesCount = 0;
            lastSentFen = null;
            board.position(game.fen());
            updateStatus();
            $('#btn-new-game').hide();
            console.log('New game started - board reset');
        }
        // 현재 상태와 다르면 업데이트
        else if (gameState.fen !== currentFen) {
            console.log('Updating game state from local:', currentFen, 'to server:', gameState.fen);
            const loadSuccess = game.load(gameState.fen);
            if (loadSuccess) {
                board.position(game.fen());
                updateStatus();
            } else {
                console.error('Failed to load FEN from server:', gameState.fen);
            }
        } else {
            console.log('Local FEN matches server FEN, no update needed.');
        }
    }
    
    // 게임 종료 처리
    if (gameState.isGameOver || (gameState.status === 'FINISHED')) {
        let message = '';
        const isCheckmate = gameState.fen && (function() {
            const tempGame = new Chess(gameState.fen);
            return tempGame.in_checkmate();
        })();

        if (gameState.winner === 'draw') {
            message = '게임 종료! 무승부입니다.';
        } else {
            const resultMsg = isCheckmate ? '체크메이트! ' : '게임 종료! ';
            if (gameState.winner === myColor) {
                message = resultMsg + '승리했습니다! 🎉';
            } else if (gameState.winner) {
                message = resultMsg + '패배했습니다.';
            }
        }
        
        if (message) {
            $('#ai-message').text(message);
            speak(message);
        }
        
        // 게임 기록 저장 및 알림창 표시
        if (userId && (gameState.isGameOver || gameState.status === 'FINISHED')) {
            const result = gameState.winner === myColor ? 'WIN' : 
                          gameState.winner === 'draw' ? 'DRAW' : 'LOSS';
            // 상대방 이름 결정: 같이하기 모드에서는 gameState에서 직접 가져오기
            let currentOpponentName = 'AI';
            if (gameMode === 'multi') {
                if (isHost && gameState.guestName) {
                    currentOpponentName = gameState.guestName;
                } else if (!isHost && gameState.hostName) {
                    currentOpponentName = gameState.hostName;
                } else if (opponentName && opponentName !== 'AI' && opponentName !== '상대방') {
                    // 저장된 opponentName 사용 (fallback)
                    currentOpponentName = opponentName;
                }
            }
            
            // 상대방이 나간 경우를 감지 (메시지에 "나갔습니다" 포함 여부 확인)
            const isOpponentDisconnected = gameState.message && gameState.message.includes('나갔습니다');
            
            $.ajax({
                url: '/api/history/' + userId,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ result: result, movesCount: movesCount, opponentName: currentOpponentName }),
                success: function() { 
                    console.log('Game history saved');
                    if (isOpponentDisconnected) {
                        alert('상대방이 나갔습니다.\n게임이 종료되었고 결과가 저장되었습니다.');
                        // 상대방이 나간 경우 내가 승리자이므로 새 게임 버튼 표시
                        $('#btn-new-game').show();
                    } else {
                        alert('게임 종료! 결과가 저장되었습니다.');
                        
                        // 승리자인 경우에만 새 게임 버튼 표시 (무승부 포함)
                        if (gameState.winner === myColor || gameState.winner === 'draw') {
                            $('#btn-new-game').show();
                        }
                        
                        // 패배자인 경우 자동으로 방에서 나가기 (무승부 제외)
                        if (gameState.winner && gameState.winner !== myColor && gameState.winner !== 'draw') {
                            console.log('Loser detected, leaving room automatically...');
                            setTimeout(() => {
                                if (stompClient && stompClient.connected) {
                                    stompClient.disconnect();
                                }
                                location.reload(); // 메인 화면(로그인)으로 이동
                            }, 2000); // 결과 확인을 위해 2초 대기
                        }
                    }
                }
            });
        }
    }
}

// 대기방 목록 조회
function loadWaitingRooms() {
    $.ajax({
        url: '/api/rooms/waiting',
        method: 'GET',
        success: function(rooms) {
            const roomsList = $('#rooms-list').empty();
            if (rooms.length === 0) {
                roomsList.append('<p style="text-align: center; padding: 20px;">대기 중인 방이 없습니다.</p>');
            } else {
                rooms.forEach(room => {
                    const roomElement = $(`
                        <div style="padding: 15px; margin: 10px 0; border: 2px solid #ffcc00; border-radius: 10px; background: #fff; cursor: pointer;">
                            <div style="font-size: 1.2rem; font-weight: bold;">${room.hostName} 대기 중...</div>
                            <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                                생성 시간: ${new Date(room.createdAt).toLocaleString()}
                            </div>
                        </div>
                    `);
                    roomElement.on('click', () => joinRoom(room.id));
                    roomsList.append(roomElement);
                });
            }
        },
        error: function() {
            alert('대기방 목록을 불러오는데 실패했습니다.');
        }
    });
}

// 방 생성
function createRoom() {
    const name = $('#username').val();
    if (!name) { alert('이름을 입력해주세요!'); return; }
    
    $.ajax({
        url: '/api/login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ name: name }),
        success: function(user) {
            userId = user.id;
            userName = user.name;
            
            $.ajax({
                url: '/api/rooms',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ hostId: userId }),
                success: function(room) {
                    roomId = room.id;
                    isHost = true;
                    myColor = 'w'; // 방장은 백색
                    opponentName = '상대방'; // 나중에 참여자가 들어오면 업데이트됨
                    
                    // 전체화면 모드로 전환
                    const docEl = document.documentElement;
                    if (docEl.requestFullscreen) docEl.requestFullscreen();
                    
                    $('#waiting-rooms-container').hide();
                    $('#login-container').hide();
                    $('#game-container').show();
                    
                    initBoard();
                    connectWebSocket(roomId);
                    
                    setTimeout(() => {
                        $('#ai-message').text('방을 만들었어요! 상대방이 들어올 때까지 기다려주세요...');
                    }, 500);
                },
                error: function() {
                    alert('방 생성에 실패했습니다.');
                }
            });
        }
    });
}

// 방 참여
function joinRoom(targetRoomId) {
    const name = $('#username').val();
    if (!name) { alert('이름을 입력해주세요!'); return; }
    
    $.ajax({
        url: '/api/login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ name: name }),
        success: function(user) {
            userId = user.id;
            userName = user.name;
            
            $.ajax({
                url: '/api/rooms/' + targetRoomId + '/join',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ guestId: userId }),
                success: function(gameState) {
                    roomId = targetRoomId;
                    isHost = false;
                    myColor = 'b'; // 참여자는 흑색
                    opponentName = gameState.hostName || '상대방'; // 상대방 이름 저장
                    
                    // 전체화면 모드로 전환
                    const docEl = document.documentElement;
                    if (docEl.requestFullscreen) docEl.requestFullscreen();
                    
                    $('#waiting-rooms-container').hide();
                    $('#login-container').hide();
                    $('#game-container').show();
                    
                    if (gameState.fen) {
                        game.load(gameState.fen);
                    }
                    
                    initBoard();
                    connectWebSocket(roomId);
                    
                    setTimeout(() => {
                        const message = `${gameState.hostName}님과의 게임이 시작되었습니다!`;
                        $('#ai-message').text(message);
                        speak(message);
                    }, 500);
                },
                error: function(xhr) {
                    const errorMsg = xhr.responseJSON?.message || '방 참여에 실패했습니다.';
                    alert(errorMsg);
                }
            });
        }
    });
}

