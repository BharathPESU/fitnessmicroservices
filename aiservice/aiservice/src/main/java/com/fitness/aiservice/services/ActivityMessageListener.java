package com.fitness.aiservice.services;

import com.fitness.aiservice.model.Activity;
import com.fitness.aiservice.model.Recommendation;
import com.fitness.aiservice.repository.RecommendationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class ActivityMessageListener {

    private final ActivityAiService activityAiService;
    private final RecommendationRepository recommendationRepository;
    @KafkaListener(topics = "${kafka.topic.name}", groupId = "activity-processor-group")
    public void processActivity(Activity activity) {
        log.info("Received Activity for Processing : {}",activity.getUserId());
        activityAiService.generateRecommendation(activity);
        try {
            Recommendation recommendation=activityAiService.generateRecommendation(activity);
            recommendationRepository.save(recommendation);
        } catch (Exception e) {

            log.error("Failed to generate recommendation",e);
        }
    }
}
