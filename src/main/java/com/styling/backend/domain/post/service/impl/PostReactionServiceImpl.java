package com.styling.backend.domain.post.service.impl;

import com.styling.backend.domain.post.dto.PostReactionRequestDto;
import com.styling.backend.domain.post.entity.Post;
import com.styling.backend.domain.post.mapper.PostReactionMapper;
import com.styling.backend.domain.post.repository.PostReactionRepository;
import com.styling.backend.domain.post.repository.PostRepository;
import com.styling.backend.domain.post.service.PostReactionService;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.styling.backend.domain.post.dto.PostReactionCountResponseDto;

@Service
@RequiredArgsConstructor
public class PostReactionServiceImpl implements PostReactionService {

    private final PostReactionRepository postReactionRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PostReactionMapper postReactionMapper;

    @Override
    @Transactional
    public void reactToPost(Long postPk, PostReactionRequestDto requestDto) {
        Integer reactionType = requestDto.getReactionType();

        if (reactionType == null || (reactionType != 0 && reactionType != 1)) {
            throw new IllegalArgumentException("반응 유형은 0 또는 1이어야 합니다.");
        }

        User user = getLoginUser();

        Post post = postRepository.findById(postPk)
                .orElseThrow(() ->
                        new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (post.getStylist().getUser().getUserPk().equals(user.getUserPk())) {
            throw new IllegalArgumentException(
                    "자신의 게시글에는 반응을 남길 수 없습니다."
            );
        }

        postReactionRepository
                .findByUser_UserPkAndPost_PostPk(user.getUserPk(), postPk)
                .ifPresentOrElse(existingReaction -> {
                    if (existingReaction.getReactionType().equals(reactionType)) {
                        postReactionRepository.delete(existingReaction);
                    } else {
                        existingReaction.changeReactionType(reactionType);
                    }
                }, () -> postReactionRepository.save(
                        postReactionMapper.toEntity(user, post, requestDto)
                ));
    }

    @Override
    @Transactional
    public void cancelReaction(Long postPk) {
        User user = getLoginUser();

        postRepository.findById(postPk)
                .orElseThrow(() ->
                        new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        postReactionRepository
                .findByUser_UserPkAndPost_PostPk(user.getUserPk(), postPk)
                .ifPresent(postReactionRepository::delete);
    }

    private User getLoginUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof String userId)) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }

        return userRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("유저를 찾을 수 없습니다."));
    }

    @Override
    @Transactional(readOnly = true)
    public PostReactionCountResponseDto getReactionCount(Long postPk) {
        postRepository.findById(postPk)
                .orElseThrow(() ->
                        new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        long likeCount =
                postReactionRepository.countByPost_PostPkAndReactionType(postPk, 0);

        long dislikeCount =
                postReactionRepository.countByPost_PostPkAndReactionType(postPk, 1);

        return new PostReactionCountResponseDto(likeCount, dislikeCount);
    }
}