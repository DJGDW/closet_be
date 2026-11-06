package com.styling.backend.domain.chat.repository;

import com.styling.backend.domain.chat.entity.ChatMessageImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageImageRepository extends JpaRepository<ChatMessageImage, Long> {

    List<ChatMessageImage> findByChatMessage_MsgPkOrderByDisplayOrderAsc(Long msgPk);

    @Modifying
    @Query("""
        DELETE FROM ChatMessageImage i
        WHERE i.chatMessage.msgPk IN (
            SELECT m.msgPk
            FROM ChatMessage m
            WHERE m.chatRoom.roomPk = :roomPk
        )
    """)
    void deleteByRoomPk(@Param("roomPk") Long roomPk);
}