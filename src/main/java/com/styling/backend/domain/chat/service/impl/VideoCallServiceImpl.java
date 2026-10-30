package com.styling.backend.domain.chat.service.impl;

import com.styling.backend.domain.chat.dto.VideoCallResponseDto;
import com.styling.backend.domain.chat.dto.VideoCallSignalRequestDto;
import com.styling.backend.domain.chat.dto.VideoCallSignalResponseDto;
import com.styling.backend.domain.chat.entity.ChatRoom;
import com.styling.backend.domain.chat.entity.VideoCall;
import com.styling.backend.domain.chat.repository.ChatRoomRepository;
import com.styling.backend.domain.chat.repository.VideoCallRepository;
import com.styling.backend.domain.chat.service.VideoCallService;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.repository.UserRepository;
import com.styling.backend.exception.BusinessException;
import com.styling.backend.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VideoCallServiceImpl implements VideoCallService {

    private final VideoCallRepository videoCallRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public VideoCall requestCall(Long roomPk) {
        User user = getAuthenticatedUser();
        ChatRoom chatRoom = getChatRoom(roomPk);

        validateRoomParticipant(chatRoom, user);
        validateActiveRoom(chatRoom);

        List<VideoCall> calls = videoCallRepository
                .findByChatRoom_RoomPkOrderByCreatedAtDesc(roomPk);

        if (!calls.isEmpty()) {
            Byte latestStatus = calls.get(0).getCallStatus();

            if (latestStatus == VideoCall.STATUS_REQUESTED
                    || latestStatus == VideoCall.STATUS_ACCEPTED) {
                throw new BusinessException(ErrorCode.INVALID_REQUEST);
            }
        }

        VideoCall videoCall =
                videoCallRepository.save(new VideoCall(chatRoom, user));

        sendCallEvent(videoCall, user);

        return videoCall;
    }

    @Override
    @Transactional
    public VideoCall acceptCall(Long roomPk, Long callPk) {
        User user = getAuthenticatedUser();
        VideoCall videoCall = getVideoCall(roomPk, callPk);

        validateRoomParticipant(videoCall.getChatRoom(), user);
        validateActiveRoom(videoCall.getChatRoom());

        if (videoCall.getInitiator().getUserPk().equals(user.getUserPk())
                || videoCall.getCallStatus() != VideoCall.STATUS_REQUESTED) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        videoCall.accept();

        sendCallEvent(videoCall, user);

        return videoCall;
    }

    @Override
    @Transactional
    public VideoCall rejectCall(Long roomPk, Long callPk) {
        User user = getAuthenticatedUser();
        VideoCall videoCall = getVideoCall(roomPk, callPk);

        validateRoomParticipant(videoCall.getChatRoom(), user);
        validateActiveRoom(videoCall.getChatRoom());

        if (videoCall.getInitiator().getUserPk().equals(user.getUserPk())
                || videoCall.getCallStatus() != VideoCall.STATUS_REQUESTED) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        videoCall.reject();

        sendCallEvent(videoCall, user);

        return videoCall;
    }

    @Override
    @Transactional
    public VideoCall cancelCall(Long roomPk, Long callPk) {
        User user = getAuthenticatedUser();
        VideoCall videoCall = getVideoCall(roomPk, callPk);

        validateRoomParticipant(videoCall.getChatRoom(), user);

        if (!videoCall.getInitiator().getUserPk().equals(user.getUserPk())
                || videoCall.getCallStatus() != VideoCall.STATUS_REQUESTED) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        videoCall.cancel();

        sendCallEvent(videoCall, user);

        return videoCall;
    }

    @Override
    @Transactional
    public VideoCall endCall(Long roomPk, Long callPk) {
        User user = getAuthenticatedUser();
        VideoCall videoCall = getVideoCall(roomPk, callPk);

        validateRoomParticipant(videoCall.getChatRoom(), user);

        if (videoCall.getCallStatus() != VideoCall.STATUS_ACCEPTED) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        videoCall.end();

        sendCallEvent(videoCall, user);

        return videoCall;
    }

    @Override
    public void sendSignal(
            Long roomPk,
            VideoCallSignalRequestDto requestDto
    ) {
        User user = getAuthenticatedUser();
        VideoCall videoCall = getVideoCall(roomPk, requestDto.getCallPk());

        validateRoomParticipant(videoCall.getChatRoom(), user);
        validateActiveRoom(videoCall.getChatRoom());

        if (videoCall.getCallStatus() != VideoCall.STATUS_ACCEPTED) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        String signalType = requestDto.getSignalType();

        if (!List.of("OFFER", "ANSWER", "ICE_CANDIDATE").contains(signalType)) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        User recipient = getOtherParticipant(videoCall.getChatRoom(), user);

        VideoCallSignalResponseDto response = new VideoCallSignalResponseDto(
                videoCall.getCallPk(),
                signalType,
                user.getUserPk(),
                requestDto.getSignalData()
        );

        messagingTemplate.convertAndSendToUser(
                recipient.getUserId(),
                "/queue/video-call",
                response
        );
    }

    private void sendCallEvent(VideoCall videoCall, User sender) {
        User recipient = getOtherParticipant(videoCall.getChatRoom(), sender);

        VideoCallResponseDto response =
                new VideoCallResponseDto(videoCall);

        messagingTemplate.convertAndSendToUser(
                recipient.getUserId(),
                "/queue/video-call",
                response
        );
    }

    private User getOtherParticipant(ChatRoom chatRoom, User user) {
        if (chatRoom.getUser().getUserPk().equals(user.getUserPk())) {
            return chatRoom.getStylist().getUser();
        }

        return chatRoom.getUser();
    }

    private ChatRoom getChatRoom(Long roomPk) {
        return chatRoomRepository.findById(roomPk)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));
    }

    private VideoCall getVideoCall(Long roomPk, Long callPk) {
        return videoCallRepository
                .findByCallPkAndChatRoom_RoomPk(callPk, roomPk)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.INVALID_REQUEST));
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

    private void validateActiveRoom(ChatRoom chatRoom) {
        if (chatRoom.getRoomStatus() != ChatRoom.STATUS_ACTIVE) {
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