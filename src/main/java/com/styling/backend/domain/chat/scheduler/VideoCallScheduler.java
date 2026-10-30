package com.styling.backend.domain.chat.scheduler;

import com.styling.backend.domain.chat.dto.VideoCallResponseDto;
import com.styling.backend.domain.chat.entity.ChatRoom;
import com.styling.backend.domain.chat.entity.VideoCall;
import com.styling.backend.domain.chat.repository.VideoCallRepository;
import com.styling.backend.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class VideoCallScheduler {

    private static final long CALL_TIMEOUT_SECONDS = 30;

    private final VideoCallRepository videoCallRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void checkMissedCalls() {
        Instant timeoutThreshold =
                Instant.now().minusSeconds(CALL_TIMEOUT_SECONDS);

        List<VideoCall> missedCalls =
                videoCallRepository.findByCallStatusAndCreatedAtBefore(
                        VideoCall.STATUS_REQUESTED,
                        timeoutThreshold
                );

        if (missedCalls.isEmpty()) {
            return;
        }

        List<CallEvent> events = new ArrayList<>();

        for (VideoCall videoCall : missedCalls) {
            if (videoCall.getCallStatus() != VideoCall.STATUS_REQUESTED) {
                continue;
            }

            videoCall.miss();

            ChatRoom chatRoom = videoCall.getChatRoom();
            User initiator = videoCall.getInitiator();

            User recipient = chatRoom.getUser().getUserPk()
                    .equals(initiator.getUserPk())
                    ? chatRoom.getStylist().getUser()
                    : chatRoom.getUser();

            VideoCallResponseDto response =
                    new VideoCallResponseDto(videoCall);

            events.add(new CallEvent(
                    initiator.getUserId(),
                    recipient.getUserId(),
                    response
            ));
        }

        if (events.isEmpty()) {
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        for (CallEvent event : events) {
                            messagingTemplate.convertAndSendToUser(
                                    event.initiatorUserId(),
                                    "/queue/video-call",
                                    event.response()
                            );

                            messagingTemplate.convertAndSendToUser(
                                    event.recipientUserId(),
                                    "/queue/video-call",
                                    event.response()
                            );
                        }
                    }
                }
        );
    }

    private record CallEvent(
            String initiatorUserId,
            String recipientUserId,
            VideoCallResponseDto response
    ) {
    }
}