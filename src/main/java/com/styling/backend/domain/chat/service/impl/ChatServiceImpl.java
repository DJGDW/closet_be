package com.styling.backend.domain.chat.service.impl;

import com.styling.backend.domain.chat.entity.ChatRoom;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatServiceImpl implements ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final StylistRepository stylistRepository;

    @Override
    @Transactional
    public ChatRoom createInquiryRoom(Long stylistPk) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof String userId)) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("사용자를 찾을 수 없습니다."));

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
}