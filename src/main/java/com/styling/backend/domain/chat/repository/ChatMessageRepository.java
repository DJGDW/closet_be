package com.styling.backend.domain.chat.repository;

import com.styling.backend.domain.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByChatRoom_RoomPkAndDeletedAtIsNullOrderBySendAtAscMsgPkAsc(
            Long roomPk
    );

    List<ChatMessage> findByChatRoom_RoomPkAndSender_UserPkAndIsReadAndDeletedAtIsNull(
            Long roomPk,
            Long senderPk,
            Byte isRead
    );

    Optional<ChatMessage> findFirstByChatRoom_RoomPkAndDeletedAtIsNullOrderBySendAtDescMsgPkDesc(
            Long roomPk
    );

    long countByChatRoom_RoomPkAndSender_UserPkAndIsReadAndDeletedAtIsNull(
            Long roomPk,
            Long senderPk,
            Byte isRead
    );

    @Modifying
    @Query("DELETE FROM ChatMessage cm WHERE cm.chatRoom.roomPk = :roomPk")
    void deleteByRoomPk(@Param("roomPk") Long roomPk);
}