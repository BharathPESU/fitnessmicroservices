package com.fitness.aiservice.services;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class GeminiService {
    private final WebClient webClient;
    @Value("${gemini.api.url}")
    private String geminiApiUrl;
    @Value("${gemini.api.key}")
    private String geminiApiKey;

    public GeminiService(WebClient.Builder webClientBuilder) {

        this.webClient=webClientBuilder.build();
    }
    public String getRecommendations(String details) {
        Map<String, Object> requestBody = Map.of(
                "model", "gemini-3.6-flash",
                "input", details
        );

        String response=webClient.post()
                .uri("https://generativelanguage.googleapis.com/v1beta/interactions")
                .header("x-goog-api-key", geminiApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();;
        return response;
    }
}
