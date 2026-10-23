package com.styling.backend.domain.post.service.impl;

import com.styling.backend.domain.post.dto.PostRecommendationResponseDto;
import com.styling.backend.domain.post.entity.Post;
import com.styling.backend.domain.post.repository.PostReactionRepository;
import com.styling.backend.domain.post.repository.PostRepository;
import com.styling.backend.domain.post.service.PostRecommendationService;
import com.styling.backend.domain.ratio.entity.RatioType;
import com.styling.backend.domain.stylist.entity.Stylist;
import com.styling.backend.domain.user.entity.StyleTypeUser;
import com.styling.backend.domain.user.repository.StyleTypeUserRepository;
import com.styling.backend.domain.user.service.UserBodyTagService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class PostRecommendationServiceImpl
        implements PostRecommendationService {

    private static final double STYLE_WEIGHT = 47.0;
    private static final double BODY_WEIGHT = 24.0;
    private static final double REACTION_WEIGHT = 17.0;
    private static final double RATING_WEIGHT = 12.0;

    private final PostRepository postRepository;
    private final PostReactionRepository postReactionRepository;
    private final StyleTypeUserRepository styleTypeUserRepository;
    private final UserBodyTagService userBodyTagService;

    public PostRecommendationServiceImpl(
            PostRepository postRepository,
            PostReactionRepository postReactionRepository,
            StyleTypeUserRepository styleTypeUserRepository,
            UserBodyTagService userBodyTagService
    ) {
        this.postRepository = postRepository;
        this.postReactionRepository = postReactionRepository;
        this.styleTypeUserRepository = styleTypeUserRepository;
        this.userBodyTagService = userBodyTagService;
    }

    @Override
    public List<PostRecommendationResponseDto> getRecommendedPosts(Long userPk) {
        if (userPk == null) {
            throw new IllegalArgumentException("사용자 PK가 필요합니다.");
        }

        // 1. 사용자가 선호하는 스타일 유형
        Set<Long> preferredStyleTypePks = new HashSet<>();

        List<StyleTypeUser> styleTypeUsers =
                styleTypeUserRepository.findByUser_UserPk(userPk);

        for (StyleTypeUser styleTypeUser : styleTypeUsers) {
            preferredStyleTypePks.add(
                    styleTypeUser.getStyleType().getTypePk()
            );
        }

        // 2. 사용자 체형 보정 태그
        Set<Long> bodyRatioTypePks = new HashSet<>();

        try {
            List<RatioType> bodyTags =
                    userBodyTagService.getUserBodyTags(userPk);

            for (RatioType bodyTag : bodyTags) {
                bodyRatioTypePks.add(bodyTag.getRatioPk());
            }
        } catch (IllegalArgumentException e) {
            // 신체 비율 정보가 없는 경우 체형 점수를 제외한다.
        }

        // 3. 게시글 조회
        List<Post> posts =
                postRepository.findAllByOrderByCreatedAtDesc();

        // 4. 점수 계산 후 DTO 변환
        List<ScoredPost> scoredPosts = new ArrayList<>();

        for (Post post : posts) {
            double score = calculateScore(
                    post,
                    preferredStyleTypePks,
                    bodyRatioTypePks
            );

            PostRecommendationResponseDto dto =
                    toResponseDto(post, score);

            scoredPosts.add(new ScoredPost(dto, score, post.getCreatedAt()));
        }

        // 5. 점수 내림차순, 동점이면 최신 게시글 우선
        scoredPosts.sort(
                Comparator.comparingDouble(ScoredPost::score)
                        .reversed()
                        .thenComparing(
                                ScoredPost::createdAt,
                                Comparator.nullsLast(
                                        Comparator.reverseOrder()
                                )
                        )
        );

        List<PostRecommendationResponseDto> result = new ArrayList<>();

        for (ScoredPost scoredPost : scoredPosts) {
            result.add(scoredPost.dto());
        }

        return result;
    }

    private double calculateScore(
            Post post,
            Set<Long> preferredStyleTypePks,
            Set<Long> bodyRatioTypePks
    ) {
        double weightedScore = 0.0;
        double availableWeight = 0.0;

        // 스타일 선호도
        if (!preferredStyleTypePks.isEmpty()) {
            Long styleTypePk = post.getStyleType().getTypePk();

            double styleScore =
                    preferredStyleTypePks.contains(styleTypePk)
                            ? 100.0 : 0.0;

            weightedScore += styleScore * STYLE_WEIGHT;
            availableWeight += STYLE_WEIGHT;
        }

        // 체형 보정 태그
        if (!bodyRatioTypePks.isEmpty()) {
            Long ratioTypePk = post.getRatioType().getRatioPk();

            double bodyScore =
                    bodyRatioTypePks.contains(ratioTypePk)
                            ? 100.0 : 0.0;

            weightedScore += bodyScore * BODY_WEIGHT;
            availableWeight += BODY_WEIGHT;
        }

        // 반응률: 좋아요 수 / 조회 수
        Integer viewCount = post.getViewCount();

        if (viewCount != null && viewCount > 0) {
            long likeCount = postReactionRepository
                    .countByPost_PostPkAndReactionType(
                            post.getPostPk(), 0
                    );

            double reactionScore = Math.min(
                    100.0,
                    (double) likeCount / viewCount * 100.0
            );

            weightedScore += reactionScore * REACTION_WEIGHT;
            availableWeight += REACTION_WEIGHT;
        }

        // 스타일리스트 평점
        Stylist stylist = post.getStylist();
        BigDecimal rating = stylist.getRating();

        if (rating != null
                && rating.compareTo(BigDecimal.ZERO) > 0) {
            double ratingScore = Math.min(
                    100.0,
                    rating.doubleValue() / 5.0 * 100.0
            );

            weightedScore += ratingScore * RATING_WEIGHT;
            availableWeight += RATING_WEIGHT;
        }

        if (availableWeight == 0.0) {
            return 0.0;
        }

        return weightedScore / availableWeight;
    }

    private PostRecommendationResponseDto toResponseDto(
            Post post,
            double score
    ) {
        Stylist stylist = post.getStylist();

        long likeCount = postReactionRepository
                .countByPost_PostPkAndReactionType(
                        post.getPostPk(), 0
                );

        return PostRecommendationResponseDto.builder()
                .postPk(post.getPostPk())
                .imageUrl(post.getContent())
                .styleName(post.getStyleType().getStyleName())
                .ratioType(post.getRatioType().getRatioType())
                .stylistPk(stylist.getStylistPk())
                .stylistNickname(stylist.getUser().getNickname())
                .stylistRating(stylist.getRating())
                .viewCount(post.getViewCount())
                .likeCount(likeCount)
                .recommendationScore(Math.round(score * 100.0) / 100.0)
                .build();
    }

    private record ScoredPost(
            PostRecommendationResponseDto dto,
            double score,
            java.time.Instant createdAt
    ) {
    }
}