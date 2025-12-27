# HTTPS 설정 가이드

Web Speech API와 마이크 사용을 위해서는 HTTPS가 필수입니다. 브라우저 보안 정책상 HTTP에서는 마이크 접근이 차단됩니다.

## 해결 방법: Nginx를 이용한 HTTPS 설정

### 1. Nginx 설치 (Rocky Linux 기준)

```bash
sudo dnf install nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2. Let's Encrypt SSL 인증서 설치

```bash
sudo dnf install certbot python3-certbot-nginx
```

### 3. 도메인 설정

도메인이 `yourdomain.com`이라고 가정합니다.

### 4. Nginx 설정 파일 생성

```bash
sudo vi /etc/nginx/conf.d/chess.conf
```

다음 내용을 입력:

```nginx
# HTTP에서 HTTPS로 리다이렉트
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 서버 설정
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL 인증서 경로 (certbot으로 자동 생성됨)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL 보안 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # WebSocket 지원을 위한 설정
    location /ws {
        proxy_pass http://localhost:7777;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 일반 HTTP 요청
    location / {
        proxy_pass http://localhost:7777;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. SSL 인증서 발급

```bash
sudo certbot --nginx -d yourdomain.com
```

인증서 발급 과정에서 이메일 주소와 약관 동의를 요청받습니다.

### 6. Nginx 설정 테스트 및 재시작

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 7. 방화벽 설정 (필요시)

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 8. 인증서 자동 갱신 설정

Let's Encrypt 인증서는 90일마다 갱신이 필요합니다. 자동 갱신 설정:

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## 대안: 자체 서명 인증서 (개발/테스트용)

프로덕션 환경이 아닌 경우 자체 서명 인증서를 사용할 수 있습니다 (브라우저 경고 발생).

### 1. 자체 서명 인증서 생성

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/chess.key \
    -out /etc/nginx/ssl/chess.crt
```

### 2. Nginx 설정 수정

위의 Nginx 설정에서 SSL 인증서 경로를 변경:

```nginx
ssl_certificate /etc/nginx/ssl/chess.crt;
ssl_certificate_key /etc/nginx/ssl/chess.key;
```

## 확인 방법

HTTPS 설정 후 브라우저에서 `https://yourdomain.com`으로 접속하여:
1. 주소창에 자물쇠 아이콘이 표시되는지 확인
2. 개발자 도구(F12) → Console에서 마이크 권한 요청이 정상적으로 작동하는지 확인

## 참고사항

- **도메인이 없는 경우**: 무료 도메인 서비스(DuckDNS, No-IP 등)를 사용하거나, IP 주소만으로는 SSL 인증서를 발급받을 수 없습니다.
- **포트 변경**: Spring Boot 서버는 기본적으로 7777 포트에서 실행되므로, Nginx는 이 포트로 프록시합니다.
- **보안**: 프로덕션 환경에서는 반드시 Let's Encrypt 같은 공인 인증서를 사용하세요.

