package com.styling.backend.domain.chat.repository;

import com.styling.backend.domain.chat.entity.ChatMessageImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageImageRepository extends JpaRepository<ChatMessageImage, Long> {

    List<ChatMessageImage> findByChatMessage_MsgPkOrderByDisplayOrderAsc(Long msgPk);
}