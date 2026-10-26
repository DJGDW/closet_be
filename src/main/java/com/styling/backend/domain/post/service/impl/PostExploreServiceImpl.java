package com.styling.backend.domain.post.service.impl;

import com.styling.backend.domain.post.dto.PostExploreResponseDto;
import com.styling.backend.domain.post.entity.Post;
import com.styling.backend.domain.post.repository.PostReactionRepository;
import com.styling.backend.domain.post.repository.PostRepository;
import com.styling.backend.domain.post.service.PostExploreService;
import com.styling.backend.domain.stylist.entity.Stylist;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostExploreServiceImpl implements PostExploreService {

    private final PostRepository postRepository;
    private final PostReactionRepository postReactionRepository;

    @Override
    public Page<PostExploreResponseDto> getExplorePosts(
            Long typePk,
            String sort,
            Pageable pageable
    ) {
        String normalizedSort = (sort == null || sort.isBlank())
                ? "LATEST"
                : sort.toUpperCase(Locale.ROOT);

        Page<Post> posts;

        switch (normalizedSort) {
            case "LATEST" -> {
                if (typePk == null) {
                    posts = postRepository
                            .findAllByOrderByCreatedAtDesc(pageable);
                } else {
                    posts = postRepository
                            .findByStyleType_TypePkOrderByCreatedAtDesc(
                                    typePk,
                                    pageable
                            );
                }
            }

            case "LIKES" -> {
                if (typePk == null) {
                    posts = postRepository
                            .findAllOrderByLikeCountDesc(pageable);
                } else {
                    posts = postRepository
                            .findByStyleTypeOrderByLikeCountDesc(
                                    typePk,
                                    pageable
                            );
                }
            }

            default -> throw new IllegalArgumentException(
                    "지원하지 않는 정렬 기준입니다: " + sort
            );
        }

        List<PostExploreResponseDto> result = posts.getContent()
                .stream()
                .map(this::toResponseDto)
                .toList();

        return new PageImpl<>(
                result,
                pageable,
                posts.getTotalElements()
        );
    }

    private PostExploreResponseDto toResponseDto(Post post) {
        Stylist stylist = post.getStylist();

        long likeCount =
                postReactionRepository.countByPost_PostPkAndReactionType(
                        post.getPostPk(),
                        0
                );

        return PostExploreResponseDto.builder()
                .postPk(post.getPostPk())
                .imageUrl(post.getContent())
                .styleName(post.getStyleType().getStyleName())
                .ratioType(post.getRatioType().getRatioType())
                .stylistPk(stylist.getStylistPk())
                .stylistNickname(stylist.getUser().getNickname())
                .stylistRating(stylist.getRating())
                .viewCount(post.getViewCount())
                .likeCount(likeCount)
                .build();
    }
}