package com.styling.backend.domain.chat.service;

import com.styling.backend.domain.chat.entity.ChatRoom;

public interface ChatService {

    ChatRoom createInquiryRoom(Long stylistPk);
}