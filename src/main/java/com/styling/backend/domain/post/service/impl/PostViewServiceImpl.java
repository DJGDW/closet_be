package com.styling.backend.domain.post.service.impl;

import com.styling.backend.domain.post.entity.Post;
import com.styling.backend.domain.post.entity.PostView;
import com.styling.backend.domain.post.repository.PostRepository;
import com.styling.backend.domain.post.repository.PostViewRepository;
import com.styling.backend.domain.post.service.PostViewService;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostViewServiceImpl implements PostViewService {

    private final PostViewRepository postViewRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public String recordPostView(Long postPk) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof String userId)) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 사용자입니다."
                ));

        Post post = postRepository.findById(postPk)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 게시글입니다."
                ));

        if (post.getStylist().getUser().getUserPk().equals(user.getUserPk())) {
            return "본인 게시글은 조회수에 반영되지 않습니다.";
        }

        if (postViewRepository.existsByPost_PostPkAndUser_UserPk(
                postPk, user.getUserPk())) {
            return "이미 조회한 게시글입니다.";
        }

        postViewRepository.save(new PostView(post, user));
        post.increaseViewCount();

        return "게시글 조회가 기록되었습니다.";
    }
}