# ♟️ 꼬마 체스 선생님 - AI와 함께하는 체스 여행

> **아이들을 위한 친절한 AI 체스 게임입니다.** OpenAI GPT를 활용하여 아이들이 체스를 배우고 즐길 수 있도록 도와주는 웹 애플리케이션입니다. 이제 친구와 함께 즐기는 멀티플레이어 모드도 지원합니다!

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen)
![WebSocket](https://img.shields.io/badge/WebSocket-STOMP-blue)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📖 프로젝트 소개

**꼬마 체스 선생님**은 초등학생을 위한 교육용 체스 게임입니다. AI가 아이의 이름을 부르며 격려하고 칭찬하는 친절한 멘트로 체스를 가르칩니다. 싱글 플레이어 모드에서는 강력한 AI와 대결하고, 멀티플레이어 모드에서는 친구와 실시간으로 실력을 겨룰 수 있습니다.

### ✨ 주요 기능

- 🤖 **AI 체스 상대**: OpenAI GPT 및 Stockfish 엔진을 결합한 지능형 체스 상대
- 👥 **실시간 멀티플레이어**: WebSocket(STOMP)을 이용한 실시간 방 생성 및 대결 기능
- 👶 **아이 친화적 UI**: 초등학생도 쉽게 사용할 수 있는 직관적이고 따뜻한 인터페이스
- 💬 **음성 격려 멘트**: Web Speech API(TTS)를 활용하여 AI가 아이의 이름을 부르며 친절하게 격려
- 📊 **자동 게임 기록**: 승패 결과를 DB에 자동 저장하여 아이의 성장 과정을 추적
- 🔄 **재경기 및 퇴장 로직**: 무승부 시 즉시 재경기 지원 및 패배자 자동 퇴장 시스템
- 📱 **PWA 지원**: 스마트폰과 태블릿에서도 홈 화면에 추가하여 앱처럼 사용 가능

---

## 🛠️ 기술 스택

### Backend
- **Java 17 / Spring Boot 3.2.0**
- **Spring Data JPA**: 데이터베이스 ORM
- **Spring WebSocket**: STOMP 프로토콜 기반 실시간 통신
- **MariaDB**: 관계형 데이터베이스
- **Lombok**: 효율적인 Java 코드 작성

### Frontend
- **HTML5 / CSS3 / JavaScript (Vanilla JS + jQuery)**
- **Chessboard.js / Chess.js**: 체스판 UI 및 게임 엔진 로직
- **Stockfish.js**: 클라이언트 사이드 체스 엔진 (싱글 모드용)
- **SockJS / Stomp.js**: 웹소켓 클라이언트 라이브러리

### AI & Speech
- **OpenAI GPT-4o-mini**: 상황별 친절한 체스 코멘트 생성
- **Web Speech API**: 시스템 TTS를 이용한 한국어 음성 출력

---

## 📁 프로젝트 구조

모듈화된 구조로 유지보수가 용이하도록 설계되었습니다.

```
src/main/
├── java/com/chess/ai/
│   ├── config/             # WebSocket, JPA 등 앱 설정
│   ├── controller/         # API 및 WebSocket 엔드포인트
│   ├── dto/                # 데이터 전송 객체
│   ├── entity/             # DB 테이블 매핑 (User, GameRoom, GameHistory)
│   ├── listener/           # WebSocket 연결/해제 이벤트 리스너
│   ├── repository/         # DB 접근 인터페이스
│   └── service/            # 핵심 비즈니스 로직 (AI 분석, 방 관리)
└── resources/
    ├── static/
    │   ├── js/
    │   │   ├── app.js            # 공통 로직 및 UI 제어
    │   │   ├── single-player.js  # 싱글 모드 (AI 대전) 로직
    │   │   └── multiplayer.js    # 멀티 모드 (WebSocket) 로직
    │   ├── index.html            # 메인 페이지
    │   └── waiting-rooms.html    # 대기방 목록 조각 (동적 로드)
    └── application.yml           # 설정 파일
```

---

## 🚀 설치 및 실행 방법

### 1. 사전 요구사항
- **JDK 17 이상**, **MariaDB**, **OpenAI API Key**

### 2. 데이터베이스 설정
```sql
CREATE DATABASE chess CHARACTER SET utf8mb4;
```

### 3. API 키 설정 (`application-local.yml`)
`src/main/resources/application-local.yml` 파일을 생성하고 키를 입력합니다.
```yaml
openai:
  api:
    key: your-api-key-here
```

### 4. 실행
```bash
mvn spring-boot:run
```
접속 주소: `http://localhost:8080`

---

## 🎮 게임 모드 설명

### 🌱 혼자하기 (Single Mode)
- **난이도 선택**: 쉬움, 보통, 어려움, 마스터 4단계 조절 가능
- **AI 선생님**: 수를 둘 때마다 GPT가 친절하게 칭찬하거나 조언해줍니다.
- **재촉 기능**: 아이가 고민에 빠지면 AI가 다정하게 말을 건넵니다.

### 🤝 같이하기 (Multiplayer Mode)
- **대기방 목록**: 현재 대기 중인 친구의 방을 확인하고 입장합니다.
- **실시간 대결**: 웹소켓을 통해 지연 없는 실시간 대결이 가능합니다.
- **중도 이탈 처리**: 상대방이 게임 중 접속을 끊으면 자동으로 남은 사람이 승리 처리됩니다.
- **승자 권한**: 게임 종료 후 승리자에게만 '새 게임' 시작 권한이 주어집니다.

---

## 👨‍👩‍👧‍👦 제작자
**소희, 선우 아빠 ❤️**  
아이들이 체스를 통해 생각하는 즐거움을 배우길 바라는 마음으로 만들었습니다.

---
**즐거운 체스 여행을 시작해보세요! ♟️**
