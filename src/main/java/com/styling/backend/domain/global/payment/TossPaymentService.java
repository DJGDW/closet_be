package com.styling.backend.domain.global.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.styling.backend.exception.BusinessException;
import com.styling.backend.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class TossPaymentService {

    private static final String TOSS_API_URL =
            "https://api.tosspayments.com/v1/payments";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String secretKey;

    public TossPaymentService(
            HttpClient httpClient,
            ObjectMapper objectMapper,
            @Value("${toss.secret-key}") String secretKey
    ) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.secretKey = secretKey;
    }

    public JsonNode confirmPayment(
            String paymentKey,
            String orderId,
            Integer amount
    ) {
        String requestBody = """
                {
                    "paymentKey": "%s",
                    "orderId": "%s",
                    "amount": %d
                }
                """.formatted(
                escapeJson(paymentKey),
                escapeJson(orderId),
                amount
        );

        return sendRequest(
                TOSS_API_URL + "/confirm",
                "POST",
                requestBody
        );
    }

    public JsonNode cancelPayment(
            String paymentKey,
            String cancelReason
    ) {
        String requestBody;

        try {
            requestBody = objectMapper.createObjectNode()
                    .put("cancelReason", cancelReason)
                    .toString();
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.TOSS_PAYMENT_FAILED);
        }

        return sendRequest(
                TOSS_API_URL + "/" + paymentKey + "/cancel",
                "POST",
                requestBody
        );
    }

    private JsonNode sendRequest(
            String url,
            String method,
            String requestBody
    ) {
        String credentials = Base64.getEncoder().encodeToString(
                (secretKey + ":").getBytes(StandardCharsets.UTF_8)
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Basic " + credentials)
                .header("Content-Type", "application/json")
                .method(
                        method,
                        HttpRequest.BodyPublishers.ofString(requestBody)
                )
                .build();

        try {
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() < 200
                    || response.statusCode() >= 300) {
                throw new BusinessException(
                        ErrorCode.TOSS_PAYMENT_FAILED
                );
            }

            return objectMapper.readTree(response.body());

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(ErrorCode.TOSS_PAYMENT_FAILED);
        } catch (IOException | IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.TOSS_PAYMENT_FAILED);
        }
    }

    private String escapeJson(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}