package com.styling.backend.domain.chat.repository;

import com.styling.backend.domain.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    Optional<ChatRoom> findByOrder_OrderPk(Long orderPk);

    Optional<ChatRoom> findFirstByUser_UserPkAndStylist_StylistPkAndRoomTypeAndRoomStatus(
            Long userPk,
            Long stylistPk,
            Byte roomType,
            Byte roomStatus
    );
}