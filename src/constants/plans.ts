export type PlanInfo = {
  id: number;
  name: string;
  tagline: string;
  description: string;
  features: string[];
};

export const PLANS: PlanInfo[] = [
  {
    id: 1,
    name: "베이직",
    tagline: "기본 상담 중심",
    description: "가볍게 시작하는 스타일 상담",
    features: ["채팅 상담", "코디 제안 1세트", "간단한 스타일 피드백"],
  },
  {
    id: 2,
    name: "스탠다드",
    tagline: "상담과 추천을 함께",
    description: "더 자세한 스타일 상담",
    features: [
      "채팅 + 영상 통화 (30분)",
      "코디 제안 2~3세트",
      "추천 상품 링크 제공",
    ],
  },
  {
    id: 3,
    name: "프리미엄",
    tagline: "집중 케어",
    description: "맞춤형 스타일링 솔루션",
    features: [
      "동행 쇼핑 (시간 협의)",
      "퍼스널 스타일 컨설팅",
      "맞춤 코디 제안 및 쇼핑 가이드",
    ],
  },
];

export function getPlanFeatures(planPk: number): string[] {
  return PLANS.find((plan) => plan.id === planPk)?.features ?? [];
}