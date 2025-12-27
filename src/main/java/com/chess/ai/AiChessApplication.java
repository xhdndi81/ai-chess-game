package com.chess.ai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AiChessApplication {

    public static void main(String[] args) {
        // 종료 시 발생하는 Tomcat 예외를 무시하기 위한 설정
        System.setProperty("spring.backgroundpreinitializer.ignore", "true");
        SpringApplication.run(AiChessApplication.class, args);
    }
}

