package com.chess.ai.service;

import com.chess.ai.dto.AIRequest;
import com.chess.ai.dto.AIResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public AIService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    public AIResponse getNextMove(AIRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        String systemPrompt = "당신은 세계 최고의 체스 그랜드마스터이자 아이들을 가르치는 선생님입니다. " +
                "현재 체스판 상태(FEN)를 정밀하게 분석하여 **가장 전술적으로 강력한 최선의 수**를 두세요. " +
                "아이의 실력에 상관없이 절대로 봐주지 말고 승리하기 위한 전략을 세우세요. " +
                "하지만 멘트는 아이가 상처받지 않게 '와! 이 수 정말 날카로운데요? 저도 집중해야겠어요!' 처럼 " +
                "아이의 도전을 격려하는 친절한 한국어로 작성하세요. " +
                "응답은 반드시 JSON 형식: {\"move\": \"SAN기보\", \"comment\": \"멘트\"} 로만 보내세요.";

        String userPrompt = "현재 FEN 상태: " + request.getFen() +
                "\n당신의 차례입니다 (" + request.getTurn() + ")" +
                "\n대결 상대(아이)의 이름: " + request.getUserName() +
                "\n**반드시 아이의 이름을 부르면서 칭찬이나 격려의 멘트를 작성하세요.**";

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-4o-mini");

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userPrompt));

        body.put("messages", messages);
        body.put("response_format", Map.of("type", "json_object"));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            String responseStr = restTemplate.postForObject(apiUrl, entity, String.class);
            JsonNode root = objectMapper.readTree(responseStr);
            String content = root.path("choices").get(0).path("message").path("content").asText();

            return objectMapper.readValue(content, AIResponse.class);
        } catch (Exception e) {
            log.error("Error calling OpenAI API", e);
            return new AIResponse("error", "미안해요, 잠시 생각 중 오류가 발생했어요. 다시 한번만 두어 볼래요?");
        }
    }
}
