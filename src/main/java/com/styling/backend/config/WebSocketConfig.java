package com.styling.backend.config;

import com.styling.backend.domain.chat.repository.ChatRoomRepository;
import com.styling.backend.domain.user.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final ChatRoomRepository chatRoomRepository;

    private static final Pattern CHAT_ROOM_DESTINATION =
            Pattern.compile("^/topic/chat/(\\d+)$");

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {

            @Override
            public Message<?> preSend(
                    Message<?> message,
                    MessageChannel channel
            ) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(
                                message,
                                StompHeaderAccessor.class
                        );

                if (accessor == null) {
                    return message;
                }

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    authenticate(accessor);
                }

                if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    validateSubscription(accessor);
                }

                return message;
            }

            private void authenticate(StompHeaderAccessor accessor) {
                String authorization =
                        accessor.getFirstNativeHeader("Authorization");

                if (authorization == null || !authorization.startsWith("Bearer ")) {
                    throw new IllegalArgumentException("JWT 인증 정보가 없습니다.");
                }

                String token = authorization.substring(7);

                if (!jwtService.isTokenValid(token)) {
                    throw new IllegalArgumentException("유효하지 않은 JWT 토큰입니다.");
                }

                String userId = jwtService.extractUserId(token);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userId,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_USER"))
                        );

                accessor.setUser(authentication);
            }

            private void validateSubscription(StompHeaderAccessor accessor) {
                Principal principal = accessor.getUser();

                if (principal == null || principal.getName() == null) {
                    throw new IllegalArgumentException("인증된 사용자가 아닙니다.");
                }

                String destination = accessor.getDestination();

                if (destination == null) {
                    throw new IllegalArgumentException("구독 경로가 올바르지 않습니다.");
                }

                Matcher matcher = CHAT_ROOM_DESTINATION.matcher(destination);

                if (!matcher.matches()) {
                    return;
                }

                Long roomPk = Long.parseLong(matcher.group(1));
                String userId = principal.getName();

                boolean isParticipant = chatRoomRepository.existsParticipantByUserId(
                        roomPk,
                        userId
                );

                if (!isParticipant) {
                    throw new IllegalArgumentException(
                            "채팅방 참여자만 구독할 수 있습니다."
                    );
                }
            }
        });
    }
}