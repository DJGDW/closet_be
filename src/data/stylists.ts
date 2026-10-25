export type StylistService = {
  name: string;
  description: string;
  price: number;
  color: string;
};

export type Stylist = {
  id: string;
  name: string;
  categories: string[];
  image: string;
  likes: number;
  reviews: number;
  rating: number;
  introduction: string;
  services: StylistService[];
  portfolios: string[];
};

const DEFAULT_SERVICES: StylistService[] = [
  {
    name: "BASIC",
    description: "기본 스타일링 상담 및 코디 제안",
    price: 50000,
    color: "#8275E8",
  },
  {
    name: "SILVER",
    description: "개인 맞춤 스타일링 컨설팅",
    price: 80000,
    color: "#68AAB5",
  },
  {
    name: "GOLD",
    description: "맞춤 스타일링 및 쇼핑 동행",
    price: 120000,
    color: "#D99A35",
  },
];

const DEFAULT_PORTFOLIOS = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800",
  "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800",
  "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800",
];

const BASE_STYLISTS = [
  {
    id: "1",
    name: "gar_dxx",
    categories: ["미니멀", "캐주얼", "모던"],
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600",
    likes: 125,
    reviews: 32,
  },
  {
    id: "2",
    name: "jaewon",
    categories: ["스트릿", "캐주얼"],
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600",
    likes: 240,
    reviews: 56,
  },
  {
    id: "3",
    name: "seoyeon_96",
    categories: ["페미닌", "미니멀"],
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600",
    likes: 310,
    reviews: 81,
  },
  {
    id: "4",
    name: "jun50_park",
    categories: ["댄디", "모던", "포멀"],
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600",
    likes: 180,
    reviews: 42,
  },
  {
    id: "5",
    name: "yujinchoi",
    categories: ["빈티지", "캐주얼"],
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600",
    likes: 98,
    reviews: 21,
  },
  {
    id: "6",
    name: "정현우",
    categories: ["스트릿", "고프코어"],
    image: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600",
    likes: 420,
    reviews: 103,
  },
  {
    id: "7",
    name: "min_daily",
    categories: ["미니멀", "모던"],
    image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600",
    likes: 155,
    reviews: 37,
  },
  {
    id: "8",
    name: "street_h",
    categories: ["스트릿", "Y2K"],
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600",
    likes: 275,
    reviews: 68,
  },
];

export const MOCK_STYLISTS: Stylist[] = BASE_STYLISTS.map((stylist, index) => ({
  ...stylist,
  rating: [4.9, 4.8, 5.0, 4.7, 4.6, 4.9, 4.8, 4.7][index],
  introduction: `${stylist.categories.join(", ")} 스타일을 중심으로 개인의 취향과 라이프스타일에 어울리는 코디를 제안합니다.`,
  services: DEFAULT_SERVICES.map((service) => ({ ...service })),
  portfolios: [...DEFAULT_PORTFOLIOS],
}));
