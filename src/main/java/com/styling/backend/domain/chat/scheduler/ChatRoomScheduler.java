package com.styling.backend.domain.chat.scheduler;

import com.styling.backend.domain.chat.entity.ChatRoom;
import com.styling.backend.domain.chat.repository.ChatMessageRepository;
import com.styling.backend.domain.chat.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ChatRoomScheduler {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Scheduled(fixedDelay = 300000)
    @Transactional
    public void deleteExpiredChatRooms() {
        List<ChatRoom> expiredRooms =
                chatRoomRepository.findByDeleteAfterLessThanEqual(Instant.now());

        for (ChatRoom room : expiredRooms) {
            chatMessageRepository.deleteByRoomPk(room.getRoomPk());
            chatRoomRepository.delete(room);
        }
    }
}