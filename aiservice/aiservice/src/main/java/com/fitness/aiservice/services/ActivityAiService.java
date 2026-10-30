package com.fitness.aiservice.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitness.aiservice.model.Activity;
import com.fitness.aiservice.model.Recommendation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
@AllArgsConstructor
public class ActivityAiService {

    private final GeminiService geminiService;
    public Recommendation generateRecommendation(Activity activity){

        String prompt=createPromptForActivity(activity);
        String aiResponse=geminiService.getRecommendations(prompt);
        log.info("Response From Ai : {}",aiResponse);
        return processAIReponse(activity,aiResponse);
    }

    private Recommendation processAIReponse(Activity activity, String aiResponse) {

        try{

            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode=mapper.readTree(aiResponse);
            JsonNode jsonTextNode = rootNode
                    .path("steps")
                    .get(1)
                    .path("content")
                    .get(0)
                    .path("text");

            String jsonContent=jsonTextNode.asText()
                    .replaceAll("```json", "")
                    .replaceAll("```text", "")
                    .replaceAll("```", "")
                    .replaceAll("\\\\n", "\n")
                    .replaceAll("\\\\\"", "\"")
                    .trim();
            log.info("Response From Clean Ai:{}",jsonContent);
            JsonNode analysisJson=mapper.readTree(jsonContent);
            JsonNode analysisNode=analysisJson.path("analysis");

            StringBuilder fullAnalysis=new StringBuilder();
            addAnalysisSection(fullAnalysis,analysisNode,"overall","Overall:");
            addAnalysisSection(fullAnalysis,analysisNode,"pace","Pace:");
            addAnalysisSection(fullAnalysis,analysisNode,"heartRate","HeartRate:");
            addAnalysisSection(fullAnalysis,analysisNode,"caloriesBurned","CaloriesBurned:");

            List<String> improvements=extractImprovements(analysisJson.path("improvements"));
            List<String> safety=extractSafetyGuideLines(analysisJson.path("safety"));
            List<String> suggestions=extractSuggestions(analysisJson.path("suggestions"));


            try {
                return Recommendation.builder().
                        activityId(activity.getId()).
                        userId(activity.getUserId()).
                        type(activity.getType().toString()).
                        recommendation(fullAnalysis.toString()).
                        improvements(improvements).
                        suggestions(suggestions).safety(safety).
                        createdAt(LocalDateTime.now()).build();
            } catch (Exception e) {
                e.printStackTrace();
                return createDefaultRecommendation(activity);
            }


        }
        catch(Exception e){
            e.printStackTrace();

        }
        return null;
    }

    private Recommendation createDefaultRecommendation(Activity activity) {
        return Recommendation.builder().
                activityId(activity.getId()).
                userId(activity.getUserId()).
                type(activity.getType().toString()).
                recommendation("unable to generate detailed analysis").
                improvements(Collections.singletonList("Continue With Your Current Routine")).
                suggestions(Collections.singletonList("Consider Consulting a Fitness Consultant")).safety(Arrays.asList("Always warm up before exercise",
                        "Stay hydrated","listen to your body")).
                createdAt(LocalDateTime.now()).build();
    }

    private List<String> extractSuggestions(JsonNode suggestionNode) {
        List<String> suggestionList=new ArrayList<>();
        if(suggestionNode.isArray()){
            suggestionNode.forEach(suggestion->{
                String description=suggestion.path("description").asText();
                String workout=suggestion.path("workout").asText();
                suggestionList.add(String.format("%s,%s",description,workout));
            });
        }
        return suggestionList.isEmpty()? Collections.singletonList("No Specific Suggestions Provided") :suggestionList;
    }

    private List<String> extractSafetyGuideLines(JsonNode safetyGuideLinesNode) {
        List<String> safetyGuideLinesList=new ArrayList<>();
        if(safetyGuideLinesNode.isArray()){
            safetyGuideLinesNode.forEach(item->safetyGuideLinesList.add(item.asText()));

        }
        else if (safetyGuideLinesNode.isTextual()) {

            safetyGuideLinesList.add(safetyGuideLinesNode.asText());
        }
        return safetyGuideLinesList.isEmpty()? Collections.singletonList("Follow General Guidelines") :safetyGuideLinesList;
    }

    private List<String> extractImprovements(JsonNode improvementsNode) {
        List<String> improvementsList=new ArrayList<>();
        if(improvementsNode.isArray()){
            improvementsNode.forEach(improvement->{
                String area=improvement.path("area").asText();
                String recommendation=improvement.path("recommendation").asText();
                improvementsList.add(String.format("%s,%s",area,recommendation));
            });
        }
        return improvementsList.isEmpty()? Collections.singletonList("No Specific Improvements Provided") :improvementsList;
    }


    private void addAnalysisSection(StringBuilder fullAnalysis, JsonNode analysisNode, String key, String prefix) {

        JsonNode node = analysisNode.path(key);

        if (!node.isMissingNode()) {
            fullAnalysis.append("=== ")
                    .append(prefix)
                    .append(" ===\n")
                    .append(node.asText())
                    .append("\n\n");
        }
    }

    private String createPromptForActivity(Activity activity) {

        return String.format("""
                        You are an expert fitness coach, sports scientist, nutritionist, exercise physiologist, recovery specialist, and health advisor.
                        
                                                                                    Analyze the user's activity data and generate personalized fitness recommendations.
                        
                                                                                    USER ACTIVITY DATA
                        
                                                                                    Activity Type: %s
                                                                                    Duration: %d minutes
                                                                                    Calories Burned: %d kcal
                                                                                    Additional Metrics: %s
                        
                                                                                    INSTRUCTIONS
                        
                                                                                    - Analyze the workout performance.
                                                                                    - Provide realistic and practical recommendations.
                                                                                    - Use simple language.
                                                                                    - If some data is missing, make reasonable assumptions.
                                                                                    - Focus on performance, endurance, recovery, nutrition, safety, and improvement.
                                                                                    - Keep responses concise and actionable.
                                                                                    - Return ONLY valid JSON.
                                                                                    - Do NOT return markdown.
                                                                                    - Do NOT return code blocks.
                                                                                    - Do NOT return explanations outside JSON.
                                                                                    - Do NOT include ```json or ```text.
                                                                                    - The response must start with { and end with }.
                        
                                                                                    ==================================================
                                                                                     OUTPUT FORMAT
                                                                                     ==================================================
                        
                                                                                     Return ONLY valid JSON.
                        
                                                                                     Do NOT return:
                                                                                     - Markdown
                                                                                     - Code blocks
                                                                                     - ```json
                                                                                     - Explanations
                                                                                     - Any text before JSON
                                                                                     - Any text after JSON
                        
                                                                                     Response must start with { and end with }
                        
                                                                                     JSON Structure:
                        
                                                                                     {
                                                                                       "analysis": {
                                                                                         "overall": "",
                                                                                         "pace": "",
                                                                                         "heartRate": "",
                                                                                         "caloriesBurned": ""
                                                                                       },
                        
                                                                                       "improvements": [
                                                                                         {
                                                                                           "area": "",
                                                                                           "recommendation": ""
                                                                                         }
                                                                                       ],
                        
                                                                                       "suggestions": [
                                                                                         {
                                                                                           "workout": "",
                                                                                           "description": ""
                                                                                         }
                                                                                       ],
                        
                                                                                       "safety": "..."
                                                                                     }
                        
                                                                                     Requirements:
                        
                                                                                     1. analysis.overall should contain a complete paragraph describing workout performance.
                        
                                                                                     2. analysis.pace should contain a complete paragraph explaining pace/speed.
                        
                                                                                     3. analysis.heartRate should contain a complete paragraph explaining heart rate impact.
                        
                                                                                     4. analysis.caloriesBurned should contain a complete paragraph explaining calorie expenditure.
                        
                                                                                     5. Return at least 4 improvement items.
                        
                                                                                     6. Return at least 3 workout suggestions.
                        
                                                                                     7. Return at least 3 safety recommendations.
                        
                                                                                     8. All values must be plain text strings.
                        
                                                                                     9. Do not return null values.
                        
                                                                                     10. Return ONLY JSON.
                                                                                     SAFETY SECTION REQUIREMENTS
                        
                                                                                     Return safety as a SINGLE STRING.
                        
                                                                                     Do NOT return an array.
                        
                                                                                     Do NOT return JSON objects.
                        
                                                                                     The safety field must contain 4-6 complete sentences written in natural language.
                        
                                                                                     Example:
                        
                                                                                     "safety": "Stay hydrated before, during, and after the workout. Avoid increasing training intensity too quickly as this may increase injury risk. Pay attention to signs of excessive fatigue such as persistent soreness or poor sleep. Maintain proper form throughout the activity to reduce stress on joints and muscles. Take at least one recovery day if you experience unusual discomfort or reduced performance."
                        """,
                activity.getType(),
                activity.getDuration(),
                activity.getCaloriesBurned(),
                activity.getAdditionalMetrics());
    }
}
