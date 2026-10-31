package com.styling.backend.domain.follow.service;

import com.styling.backend.domain.follow.dto.FollowResponseDto;
import com.styling.backend.domain.follow.entity.Follow;
import com.styling.backend.domain.follow.repository.FollowRepository;
import com.styling.backend.domain.stylist.entity.Stylist;
import com.styling.backend.domain.stylist.repository.StylistRepository;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FollowServiceImpl implements FollowService {

    private final FollowRepository followRepository;
    private final StylistRepository stylistRepository;
    private final UserRepository userRepository;

    @Override
    public void followStylist(Long stylistPk) {
        String userId = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Stylist stylist = stylistRepository.findById(stylistPk)
                .orElseThrow(() -> new IllegalArgumentException("스타일리스트를 찾을 수 없습니다."));

        if (stylist.getUser().getUserPk().equals(user.getUserPk())) {
            throw new IllegalArgumentException("본인은 팔로우할 수 없습니다.");
        }

        if (followRepository.existsByUser_UserPkAndStylist_StylistPk(
                user.getUserPk(), stylistPk)) {
            throw new IllegalArgumentException("이미 팔로우한 스타일리스트입니다.");
        }

        followRepository.save(new Follow(user, stylist));
    }

    @Override
    public void unfollowStylist(Long stylistPk) {
        String userId = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Follow follow = followRepository
                .findByUser_UserPkAndStylist_StylistPk(
                        user.getUserPk(), stylistPk)
                .orElseThrow(() -> new IllegalArgumentException("팔로우한 기록이 없습니다."));

        followRepository.delete(follow);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FollowResponseDto> getFollowings() {
        String userId = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return followRepository.findAllByUser_UserPk(user.getUserPk())
                .stream()
                .map(follow -> new FollowResponseDto(follow.getStylist()))
                .toList();
    }
}