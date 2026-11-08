package com.styling.backend.config;

import com.styling.backend.domain.chat.entity.ChatRoom;
import com.styling.backend.domain.chat.repository.ChatRoomRepository;
import com.styling.backend.domain.location.entity.Location;
import com.styling.backend.domain.location.repository.LocationRepository;
import com.styling.backend.domain.stylist.entity.Stylist;
import com.styling.backend.domain.stylist.repository.StylistRepository;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.repository.UserRepository;
import com.styling.backend.domain.user.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.ReflectionUtils;

import java.time.LocalDate;

/**
 * test 프로필에서만 동작하는 시드 데이터.
 * H2 인메모리 DB는 서버를 재시작할 때마다 비워지므로,
 * 서버가 뜰 때마다 테스트 계정 2개 + 스타일리스트 + 채팅방을 만든다.
 */
@Slf4j
@Component
@Profile("test")
@RequiredArgsConstructor
public class TestDataSeeder implements CommandLineRunner {

    private static final String USER_ID = "testuser";
    private static final String STYLIST_ID = "teststylist";
    private static final String PASSWORD = "test1234";

    private final UserRepository userRepository;
    private final StylistRepository stylistRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final LocationRepository locationRepository;
    private final JwtService jwtService;

    @Override
    public void run(String... args) {
        if (userRepository.existsByUserId(USER_ID)) {
            log.info("[시드] 이미 테스트 데이터가 있어 건너뜁니다.");
            return;
        }

        String encodedPw = new BCryptPasswordEncoder().encode(PASSWORD);

        User user = userRepository.save(new User(
                "테스트유저",
                USER_ID,
                encodedPw,
                "01011112222",
                LocalDate.of(1995, 1, 1),
                "testuser@test.com",
                "유저1",
                0,
                null
        ));

        User stylistUser = userRepository.save(new User(
                "테스트스타일",
                STYLIST_ID,
                encodedPw,
                "01033334444",
                LocalDate.of(1990, 1, 1),
                "teststylist@test.com",
                "스타일리스트1",
                1,
                null
        ));

        Location location = createLocation();

        Stylist stylist = stylistRepository.save(
                new Stylist("테스트용 스타일리스트입니다.", stylistUser, location)
        );

        // 결제 타입 채팅방(만료 없음), 주문(order)은 null
        ChatRoom room = chatRoomRepository.save(new ChatRoom(user, stylist, null));

        String userToken = jwtService.generateAccessToken(USER_ID);
        String stylistToken = jwtService.generateAccessToken(STYLIST_ID);

        log.info("""

                ================ 테스트 데이터 ================
                roomPk : {}
                [일반 유저]   id={} / pw={}
                accessToken : {}
                [스타일리스트] id={} / pw={}
                accessToken : {}
                ===============================================
                """,
                room.getRoomPk(),
                USER_ID, PASSWORD, userToken,
                STYLIST_ID, PASSWORD, stylistToken);
    }

    // Location은 생성자/setter가 없어서(@NoArgsConstructor + @Getter만 있음)
    // 엔티티 코드를 건드리지 않고 리플렉션으로 필드 값을 채운다.
    private Location createLocation() {
        Location location = new Location();

        setField(location, "locationName", "서울");
        setField(location, "locationCode", "SEOUL");

        return locationRepository.save(location);
    }

    private void setField(Object target, String fieldName, Object value) {
        var field = ReflectionUtils.findField(target.getClass(), fieldName);

        if (field == null) {
            throw new IllegalStateException(
                    target.getClass().getSimpleName() + "에 필드가 없습니다: " + fieldName
            );
        }

        ReflectionUtils.makeAccessible(field);
        ReflectionUtils.setField(field, target, value);
    }
}