package com.styling.backend.domain.chat.service.impl;

import com.styling.backend.domain.chat.dto.ChatMessageResponseDto;
import com.styling.backend.domain.chat.dto.ChatRoomListResponseDto;
import com.styling.backend.domain.chat.entity.ChatMessage;
import com.styling.backend.domain.chat.entity.ChatMessageImage;
import com.styling.backend.domain.chat.entity.ChatRoom;
import com.styling.backend.domain.chat.repository.ChatMessageImageRepository;
import com.styling.backend.domain.chat.repository.ChatMessageRepository;
import com.styling.backend.domain.chat.repository.ChatRoomRepository;
import com.styling.backend.domain.chat.service.ChatService;
import com.styling.backend.domain.stylist.entity.Stylist;
import com.styling.backend.domain.stylist.repository.StylistRepository;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.repository.UserRepository;
import com.styling.backend.exception.BusinessException;
import com.styling.backend.exception.ErrorCode;
import com.styling.backend.global.image.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatServiceImpl implements ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatMessageImageRepository chatMessageImageRepository;
    private final UserRepository userRepository;
    private final StylistRepository stylistRepository;
    private final ImageService imageService;

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
    @Transactional
    public ChatMessage sendImageMessage(Long roomPk, List<MultipartFile> images) {
        User user = getAuthenticatedUser();

        ChatRoom chatRoom = chatRoomRepository.findById(roomPk)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        validateRoomParticipant(chatRoom, user);

        if (chatRoom.getRoomStatus() != ChatRoom.STATUS_ACTIVE) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        if (images == null || images.isEmpty()
                || images.stream().anyMatch(image ->
                image == null || image.isEmpty())) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        ChatMessage message = chatMessageRepository.save(
                new ChatMessage(
                        chatRoom,
                        user,
                        ChatMessage.TYPE_IMAGE,
                        null
                )
        );

        for (int i = 0; i < images.size(); i++) {
            String imageUrl = imageService.uploadImage(
                    images.get(i),
                    "chat/" + roomPk
            );

            if (imageUrl == null) {
                throw new IllegalStateException("채팅 이미지 업로드에 실패했습니다.");
            }

            chatMessageImageRepository.save(
                    new ChatMessageImage(message, imageUrl, i)
            );
        }

        return message;
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
                .map(message -> {
                    List<String> imageUrls =
                            chatMessageImageRepository
                                    .findByChatMessage_MsgPkOrderByDisplayOrderAsc(
                                            message.getMsgPk()
                                    )
                                    .stream()
                                    .map(ChatMessageImage::getImageUrl)
                                    .toList();

                    return new ChatMessageResponseDto(message, imageUrls);
                })
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

    @Override
    public List<ChatRoomListResponseDto> getActiveChatRooms() {
        User user = getAuthenticatedUser();

        return getChatRoomsByStatus(user, ChatRoom.STATUS_ACTIVE);
    }

    @Override
    public List<ChatRoomListResponseDto> getClosedChatRooms() {
        User user = getAuthenticatedUser();

        return getChatRoomsByStatus(user, ChatRoom.STATUS_CLOSED);
    }

    private List<ChatRoomListResponseDto> getChatRoomsByStatus(
            User user,
            Byte roomStatus
    ) {
        List<ChatRoom> userRooms =
                chatRoomRepository.findByUser_UserPkAndRoomStatusOrderByCreatedAtDesc(
                        user.getUserPk(),
                        roomStatus
                );

        List<ChatRoom> stylistRooms =
                chatRoomRepository.findByStylist_User_UserPkAndRoomStatusOrderByCreatedAtDesc(
                        user.getUserPk(),
                        roomStatus
                );

        Map<Long, ChatRoom> roomMap = Stream.concat(
                        userRooms.stream(),
                        stylistRooms.stream()
                )
                .collect(Collectors.toMap(
                        ChatRoom::getRoomPk,
                        Function.identity(),
                        (existing, duplicate) -> existing
                ));

        return roomMap.values()
                .stream()
                .map(chatRoom -> {
                    User opponent = getOpponent(chatRoom, user);

                    ChatMessage lastMessage =
                            chatMessageRepository
                                    .findFirstByChatRoom_RoomPkAndDeletedAtIsNullOrderBySendAtDescMsgPkDesc(
                                            chatRoom.getRoomPk()
                                    )
                                    .orElse(null);

                    Long unreadCount =
                            chatMessageRepository
                                    .countByChatRoom_RoomPkAndSender_UserPkAndIsReadAndDeletedAtIsNull(
                                            chatRoom.getRoomPk(),
                                            opponent.getUserPk(),
                                            (byte) 0
                                    );

                    return new ChatRoomListResponseDto(
                            chatRoom,
                            opponent,
                            lastMessage,
                            unreadCount
                    );
                })
                .sorted(Comparator.comparing(
                        (ChatRoomListResponseDto room) ->
                                room.getLastMessageAt() != null
                                        ? room.getLastMessageAt()
                                        : Instant.MIN,
                        Comparator.reverseOrder()
                ))
                .toList();
    }

    private User getOpponent(ChatRoom chatRoom, User user) {
        if (chatRoom.getUser().getUserPk().equals(user.getUserPk())) {
            return chatRoom.getStylist().getUser();
        }

        return chatRoom.getUser();
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