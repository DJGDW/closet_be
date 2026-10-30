package com.styling.backend.domain.chat.repository;

import com.styling.backend.domain.chat.entity.VideoCall;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface VideoCallRepository extends JpaRepository<VideoCall, Long> {

    Optional<VideoCall> findByCallPkAndChatRoom_RoomPk(
            Long callPk,
            Long roomPk
    );

    List<VideoCall> findByChatRoom_RoomPkOrderByCreatedAtDesc(
            Long roomPk
    );

    Optional<VideoCall> findFirstByChatRoom_RoomPkAndCallStatusOrderByCreatedAtDesc(
            Long roomPk,
            Byte callStatus
    );

    List<VideoCall> findByCallStatusAndCreatedAtBefore(
            Byte callStatus,
            Instant createdAt
    );
}