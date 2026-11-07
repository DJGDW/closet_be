package com.styling.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.http.HttpClient;

@Configuration
public class TossPaymentConfig {

    @Bean
    public HttpClient tossHttpClient() {
        return HttpClient.newHttpClient();
    }
}