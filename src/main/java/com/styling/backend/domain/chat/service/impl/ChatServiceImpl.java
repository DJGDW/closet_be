package com.styling.backend.domain.chat.service.impl;

import com.styling.backend.domain.chat.dto.ChatMessageResponseDto;
import com.styling.backend.domain.chat.entity.ChatMessage;
import com.styling.backend.domain.chat.entity.ChatRoom;
import com.styling.backend.domain.chat.repository.ChatMessageRepository;
import com.styling.backend.domain.chat.repository.ChatRoomRepository;
import com.styling.backend.domain.chat.service.ChatService;
import com.styling.backend.domain.stylist.entity.Stylist;
import com.styling.backend.domain.stylist.repository.StylistRepository;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.repository.UserRepository;
import com.styling.backend.exception.BusinessException;
import com.styling.backend.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatServiceImpl implements ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final StylistRepository stylistRepository;

    @Override
    @Transactional
    public ChatRoom createInquiryRoom(Long stylistPk) {
        User user = getAuthenticatedUser();

        Stylist stylist = stylistRepository.findById(stylistPk)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.STYLIST_NOT_FOUND));

        return chatRoomRepository
                .findFirstByUser_UserPkAndStylist_StylistPkAndRoomTypeAndRoomStatus(
                        user.getUserPk(),
                        stylistPk,
                        ChatRoom.TYPE_INQUIRY,
                        ChatRoom.STATUS_ACTIVE
                )
                .orElseGet(() ->
                        chatRoomRepository.save(
                                ChatRoom.createInquiryRoom(user, stylist)
                        )
                );
    }

    @Override
    @Transactional
    public ChatMessage sendTextMessage(Long roomPk, String msgContent) {
        User user = getAuthenticatedUser();

        ChatRoom chatRoom = chatRoomRepository.findById(roomPk)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        validateRoomParticipant(chatRoom, user);

        if (chatRoom.getRoomStatus() != ChatRoom.STATUS_ACTIVE) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        ChatMessage message = new ChatMessage(
                chatRoom,
                user,
                ChatMessage.TYPE_TEXT,
                msgContent
        );

        return chatMessageRepository.save(message);
    }

    @Override
    public List<ChatMessageResponseDto> getMessages(Long roomPk) {
        User user = getAuthenticatedUser();

        ChatRoom chatRoom = chatRoomRepository.findById(roomPk)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        validateRoomParticipant(chatRoom, user);

        return chatMessageRepository
                .findByChatRoom_RoomPkAndDeletedAtIsNullOrderBySendAtAscMsgPkAsc(
                        roomPk
                )
                .stream()
                .map(ChatMessageResponseDto::new)
                .toList();
    }

    @Override
    @Transactional
    public void markMessagesAsRead(Long roomPk) {
        User user = getAuthenticatedUser();

        ChatRoom chatRoom = chatRoomRepository.findById(roomPk)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        validateRoomParticipant(chatRoom, user);

        List<ChatMessage> unreadMessages =
                chatMessageRepository
                        .findByChatRoom_RoomPkAndSender_UserPkAndIsReadAndDeletedAtIsNull(
                                roomPk,
                                getOpponentUserPk(chatRoom, user),
                                (byte) 0
                        );

        unreadMessages.forEach(ChatMessage::markAsRead);
    }

    private Long getOpponentUserPk(ChatRoom chatRoom, User user) {
        if (chatRoom.getUser().getUserPk().equals(user.getUserPk())) {
            return chatRoom.getStylist().getUser().getUserPk();
        }

        return chatRoom.getUser().getUserPk();
    }

    private void validateRoomParticipant(ChatRoom chatRoom, User user) {
        boolean isUser = chatRoom.getUser().getUserPk()
                .equals(user.getUserPk());

        boolean isStylist = chatRoom.getStylist().getUser().getUserPk()
                .equals(user.getUserPk());

        if (!isUser && !isStylist) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }
    }

    private User getAuthenticatedUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof String userId)) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        return userRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}