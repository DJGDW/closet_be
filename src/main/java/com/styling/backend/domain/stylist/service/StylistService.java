package com.styling.backend.domain.stylist.service;

import com.styling.backend.domain.follow.repository.FollowRepository;
import com.styling.backend.domain.location.entity.Location;
import com.styling.backend.domain.location.repository.LocationRepository;
import com.styling.backend.domain.plan.entity.Plan;
import com.styling.backend.domain.plan.repository.PlanRepository;
import com.styling.backend.domain.post.repository.PostRepository;
import com.styling.backend.domain.styletype.entity.StyleType;
import com.styling.backend.domain.styletype.repository.StyleTypeRepository;
import com.styling.backend.domain.stylist.dto.StylistRegisterRequestDto;
import com.styling.backend.domain.stylist.dto.response.StylistCheckResponseDto;
import com.styling.backend.domain.stylist.dto.response.StylistDetailResponseDto;
import com.styling.backend.domain.stylist.entity.Stylist;
import com.styling.backend.domain.stylist.entity.StylistPlan;
import com.styling.backend.domain.stylist.entity.StylistStyleType;
import com.styling.backend.domain.stylist.mapper.StylistMapper;
import com.styling.backend.domain.stylist.repository.StylistPlanRepository;
import com.styling.backend.domain.stylist.repository.StylistRepository;
import com.styling.backend.domain.stylist.repository.StylistStyleTypeRepository;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.repository.UserRepository;
import com.styling.backend.exception.BusinessException;
import com.styling.backend.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StylistService {

    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final StyleTypeRepository styleTypeRepository;
    private final PlanRepository planRepository;
    private final StylistRepository stylistRepository;
    private final StylistStyleTypeRepository stylistStyleTypeRepository;
    private final StylistPlanRepository stylistPlanRepository;
    private final StylistMapper stylistMapper;
    private final PostRepository postRepository;
    private final FollowRepository followRepository;

    @Transactional
    public void register(StylistRegisterRequestDto request) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof String userId)) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (stylistRepository.existsByUser_UserPk(user.getUserPk())) {
            throw new BusinessException(ErrorCode.STYLIST_ALREADY_REGISTERED);
        }

        Location location = locationRepository.findById(request.getLocationPk())
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.LOCATION_NOT_FOUND));

        List<Long> styleTypePks = request.getStyleTypePks();
        Set<Long> uniqueStyleTypePks = new HashSet<>(styleTypePks);

        if (uniqueStyleTypePks.size() != styleTypePks.size()) {
            throw new BusinessException(ErrorCode.DUPLICATE_STYLE_TYPE);
        }

        List<StyleType> styleTypes =
                styleTypeRepository.findAllById(styleTypePks);

        if (styleTypes.size() != uniqueStyleTypePks.size()) {
            throw new BusinessException(ErrorCode.STYLE_TYPE_NOT_FOUND);
        }

        List<StylistRegisterRequestDto.StylistPlanRequestDto> planRequests =
                request.getPlans();

        Set<Integer> uniquePlanPks = new HashSet<>();

        for (StylistRegisterRequestDto.StylistPlanRequestDto planRequest
                : planRequests) {
            if (!uniquePlanPks.add(planRequest.getPlanPk())) {
                throw new BusinessException(ErrorCode.DUPLICATE_PLAN);
            }
        }

        List<Plan> plans = planRepository.findAllById(uniquePlanPks);

        if (plans.size() != uniquePlanPks.size()) {
            throw new BusinessException(ErrorCode.PLAN_NOT_FOUND);
        }

        Stylist stylist = stylistMapper.toEntity(request, user, location);
        stylistRepository.save(stylist);

        user.changeRole(1);

        for (StyleType styleType : styleTypes) {
            StylistStyleType stylistStyleType =
                    stylistMapper.toStyleTypeEntity(styleType, stylist);
            stylistStyleTypeRepository.save(stylistStyleType);
        }

        for (StylistRegisterRequestDto.StylistPlanRequestDto planRequest
                : planRequests) {
            Plan plan = plans.stream()
                    .filter(p -> p.getPlanPk().equals(planRequest.getPlanPk()))
                    .findFirst()
                    .orElseThrow();

            StylistPlan stylistPlan = stylistMapper.toPlanEntity(
                    plan, stylist, planRequest.getPrice()
            );

            stylistPlanRepository.save(stylistPlan);
        }
    }

    @Transactional
    public void updateMyInfo(StylistRegisterRequestDto request) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof String userId)) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        Stylist stylist = stylistRepository.findByUser_UserId(userId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.STYLIST_NOT_FOUND));

        Location location = locationRepository.findById(request.getLocationPk())
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.LOCATION_NOT_FOUND));

        List<Long> styleTypePks = request.getStyleTypePks();
        Set<Long> uniqueStyleTypePks = new HashSet<>(styleTypePks);

        if (uniqueStyleTypePks.size() != styleTypePks.size()) {
            throw new BusinessException(ErrorCode.DUPLICATE_STYLE_TYPE);
        }

        List<StyleType> styleTypes =
                styleTypeRepository.findAllById(styleTypePks);

        if (styleTypes.size() != uniqueStyleTypePks.size()) {
            throw new BusinessException(ErrorCode.STYLE_TYPE_NOT_FOUND);
        }

        List<StylistRegisterRequestDto.StylistPlanRequestDto> planRequests =
                request.getPlans();

        Set<Integer> uniquePlanPks = new HashSet<>();

        for (StylistRegisterRequestDto.StylistPlanRequestDto planRequest
                : planRequests) {
            if (!uniquePlanPks.add(planRequest.getPlanPk())) {
                throw new BusinessException(ErrorCode.DUPLICATE_PLAN);
            }
        }

        List<Plan> plans = planRepository.findAllById(uniquePlanPks);

        if (plans.size() != uniquePlanPks.size()) {
            throw new BusinessException(ErrorCode.PLAN_NOT_FOUND);
        }

        List<StylistStyleType> existingStyleTypes =
                stylistStyleTypeRepository.findAllByStylist_StylistPk(
                        stylist.getStylistPk()
                );

        List<StylistPlan> existingPlans =
                stylistPlanRepository.findAllByStylist_StylistPk(
                        stylist.getStylistPk()
                );

        if (existingStyleTypes.size() != styleTypes.size()
                || existingPlans.size() != planRequests.size()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        existingStyleTypes.sort(
                Comparator.comparing(StylistStyleType::getStylistTypePk)
        );

        existingPlans.sort(
                Comparator.comparing(StylistPlan::getStylistPlanPk)
        );

        Map<Long, StyleType> styleTypeMap = new HashMap<>();

        for (StyleType styleType : styleTypes) {
            styleTypeMap.put(styleType.getTypePk(), styleType);
        }

        Map<Integer, Plan> planMap = new HashMap<>();

        for (Plan plan : plans) {
            planMap.put(plan.getPlanPk(), plan);
        }

        stylist.updateInfo(request.getIntroduction(), location);

        for (int i = 0; i < existingStyleTypes.size(); i++) {
            StyleType styleType = styleTypeMap.get(styleTypePks.get(i));
            existingStyleTypes.get(i).updateStyleType(styleType);
        }

        for (int i = 0; i < existingPlans.size(); i++) {
            StylistRegisterRequestDto.StylistPlanRequestDto planRequest =
                    planRequests.get(i);

            Plan plan = planMap.get(planRequest.getPlanPk());

            existingPlans.get(i).updatePlan(
                    plan,
                    planRequest.getPrice()
            );
        }
    }

    @Transactional(readOnly = true)
    public StylistCheckResponseDto checkStylist() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof String userId)) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        boolean isStylist =
                stylistRepository.existsByUser_UserPk(user.getUserPk());

        return new StylistCheckResponseDto(isStylist);
    }

    @Transactional(readOnly = true)
    public StylistDetailResponseDto getStylistDetail(Long stylistPk) {

        Stylist stylist = stylistRepository.findById(stylistPk)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.STYLIST_NOT_FOUND));

        List<StylistStyleType> stylistStyleTypes =
                stylistStyleTypeRepository.findAllByStylist_StylistPk(stylistPk);

        List<StylistPlan> stylistPlans =
                stylistPlanRepository.findAllByStylist_StylistPk(stylistPk);

        Long postCount =
                postRepository.countByStylist_StylistPk(stylistPk);

        Long followerCount =
                followRepository.countByStylist_StylistPk(stylistPk);

        return stylistMapper.toDetailResponseDto(
                stylist,
                stylistStyleTypes,
                stylistPlans,
                postCount,
                followerCount
        );
    }
}