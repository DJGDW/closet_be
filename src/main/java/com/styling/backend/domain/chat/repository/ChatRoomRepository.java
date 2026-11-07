package com.styling.backend.domain.chat.repository;

import com.styling.backend.domain.chat.entity.ChatRoom;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    Optional<ChatRoom> findByOrder_OrderPk(Long orderPk);

    Optional<ChatRoom> findFirstByUser_UserPkAndStylist_StylistPkAndRoomTypeAndRoomStatus(
            Long userPk,
            Long stylistPk,
            Byte roomType,
            Byte roomStatus
    );

    List<ChatRoom> findByUser_UserPkAndRoomStatusOrderByCreatedAtDesc(
            Long userPk,
            Byte roomStatus
    );

    List<ChatRoom> findByStylist_User_UserPkAndRoomStatusOrderByCreatedAtDesc(
            Long userPk,
            Byte roomStatus
    );

    @Query("""
            SELECT cr
            FROM ChatRoom cr
            LEFT JOIN FETCH cr.order
            WHERE cr.user.userPk = :userPk
              AND cr.roomStatus = :roomStatus
            ORDER BY cr.createdAt DESC
            """)
    List<ChatRoom> findByUserWithOrder(
            @Param("userPk") Long userPk,
            @Param("roomStatus") Byte roomStatus
    );

    @Query("""
            SELECT cr
            FROM ChatRoom cr
            LEFT JOIN FETCH cr.order
            WHERE cr.stylist.user.userPk = :userPk
              AND cr.roomStatus = :roomStatus
            ORDER BY cr.createdAt DESC
            """)
    List<ChatRoom> findByStylistWithOrder(
            @Param("userPk") Long userPk,
            @Param("roomStatus") Byte roomStatus
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT cr FROM ChatRoom cr WHERE cr.roomPk = :roomPk")
    Optional<ChatRoom> findByRoomPkWithLock(
            @Param("roomPk") Long roomPk
    );

    @Query("""
            SELECT COUNT(cr) > 0
            FROM ChatRoom cr
            WHERE cr.roomPk = :roomPk
              AND (
                  cr.user.userPk = :userPk
                  OR cr.stylist.user.userPk = :userPk
              )
            """)
    boolean existsParticipant(
            @Param("roomPk") Long roomPk,
            @Param("userPk") Long userPk
    );

    @Query("""
            SELECT COUNT(cr) > 0
            FROM ChatRoom cr
            WHERE cr.roomPk = :roomPk
              AND (
                  cr.user.userId = :userId
                  OR cr.stylist.user.userId = :userId
              )
            """)
    boolean existsParticipantByUserId(
            @Param("roomPk") Long roomPk,
            @Param("userId") String userId
    );

    List<ChatRoom> findByDeleteAfterLessThanEqual(Instant now);
}