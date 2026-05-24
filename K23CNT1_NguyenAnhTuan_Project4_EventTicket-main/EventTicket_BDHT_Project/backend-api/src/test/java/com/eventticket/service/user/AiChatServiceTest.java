package com.eventticket.service.user;

import com.eventticket.config.AiChatProperties;
import com.eventticket.repository.AiChatLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class AiChatServiceTest {

    @Test
    void shouldReturnFallbackWhenApiKeyIsMissing() {
        AiChatLogRepository repository = mock(AiChatLogRepository.class);
        AiChatProperties properties = new AiChatProperties();
        properties.setApiKey("");

        AiChatService service = new AiChatService(repository, properties, RestClient.builder());

        String response = service.generateAiResponse("Tôi muốn tìm sự kiện gần đây");

        assertThat(response)
                .contains("AI chưa được cấu hình")
                .contains("AI_CHAT_API_KEY");
    }

    @Test
    void shouldGuideGuestsWhenAiProviderIsUnavailable() {
        AiChatLogRepository repository = mock(AiChatLogRepository.class);
        AiChatProperties properties = new AiChatProperties();
        properties.setApiKey("test-key");
        properties.setBaseUrl("http://127.0.0.1:1");

        AiChatService service = new AiChatService(repository, properties, RestClient.builder());

        String response = service.generateAiResponse("Tôi không biết bắt đầu");

        assertThat(response)
                .contains("Bước 1")
                .contains("Bước 2")
                .contains("Bước 3")
                .contains("thử lại sau");
    }

    @Test
    void shouldPreserveUtf8WhenExtractingGeminiResponse() {
        AiChatLogRepository repository = mock(AiChatLogRepository.class);
        AiChatProperties properties = new AiChatProperties();
        AiChatService service = new AiChatService(repository, properties, RestClient.builder());

        String geminiResponse = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {"text": "Chào bạn, đây là phản hồi tiếng Việt đầy đủ."}
                        ]
                      }
                    }
                  ]
                }
                """;

        assertThat(service.extractGeminiResponse(geminiResponse))
                .isEqualTo("Chào bạn, đây là phản hồi tiếng Việt đầy đủ.");
    }
}
