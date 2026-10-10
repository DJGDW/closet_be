package com.styling.backend.domain.stylist.service;

import com.styling.backend.domain.location.entity.Location;
import com.styling.backend.domain.location.repository.LocationRepository;
import com.styling.backend.domain.plan.entity.Plan;
import com.styling.backend.domain.plan.repository.PlanRepository;
import com.styling.backend.domain.styletype.entity.StyleType;
import com.styling.backend.domain.styletype.repository.StyleTypeRepository;
import com.styling.backend.domain.stylist.dto.StylistRegisterRequestDto;
import com.styling.backend.domain.stylist.entity.Stylist;
import com.styling.backend.domain.stylist.entity.StylistPlan;
import com.styling.backend.domain.stylist.entity.StylistStyleType;
import com.styling.backend.domain.stylist.mapper.StylistMapper;
import com.styling.backend.domain.stylist.repository.StylistPlanRepository;
import com.styling.backend.domain.stylist.repository.StylistRepository;
import com.styling.backend.domain.stylist.repository.StylistStyleTypeRepository;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
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

    @Transactional
    public void register(StylistRegisterRequestDto request) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof String userId)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."
            );
        }

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "사용자 정보를 찾을 수 없습니다."
                ));

        if (stylistRepository.existsByUser_UserPk(user.getUserPk())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "이미 스타일리스트로 등록되어 있습니다."
            );
        }

        Location location = locationRepository.findById(request.getLocationPk())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "존재하지 않는 활동 지역입니다."
                ));

        List<Long> styleTypePks = request.getStyleTypePks();
        Set<Long> uniqueStyleTypePks = new HashSet<>(styleTypePks);

        if (uniqueStyleTypePks.size() != styleTypePks.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "중복된 스타일 유형이 있습니다."
            );
        }

        List<StyleType> styleTypes = styleTypeRepository.findAllById(styleTypePks);

        if (styleTypes.size() != uniqueStyleTypePks.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "존재하지 않는 스타일 유형이 포함되어 있습니다."
            );
        }

        List<StylistRegisterRequestDto.StylistPlanRequestDto> planRequests =
                request.getPlans();

        Set<Integer> uniquePlanPks = new HashSet<>();

        for (StylistRegisterRequestDto.StylistPlanRequestDto planRequest : planRequests) {
            if (!uniquePlanPks.add(planRequest.getPlanPk())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "중복된 플랜이 있습니다."
                );
            }
        }

        List<Plan> plans = planRepository.findAllById(uniquePlanPks);

        if (plans.size() != uniquePlanPks.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "존재하지 않는 플랜이 포함되어 있습니다."
            );
        }

        Stylist stylist = stylistMapper.toEntity(request, user, location);
        stylistRepository.save(stylist);

        for (StyleType styleType : styleTypes) {
            StylistStyleType stylistStyleType =
                    stylistMapper.toStyleTypeEntity(styleType, stylist);
            stylistStyleTypeRepository.save(stylistStyleType);
        }

        for (StylistRegisterRequestDto.StylistPlanRequestDto planRequest : planRequests) {
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
}