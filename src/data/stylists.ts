
import type { ImageSourcePropType } from "react-native";

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
  image: ImageSourcePropType;
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

const BASE_STYLISTS: Omit<
  Stylist,
  "rating" | "introduction" | "services" | "portfolios"
>[] = [
  {
    id: "1",
    name: "admin",
    categories: ["미니멀", "캐주얼", "모던"],
    image: require("../../assets/images/stylink_mockup/admin_profile.png"),
    likes: 125,
    reviews: 32,
  },
  {
    id: "2",
    name: "admin1",
    categories: ["스트릿", "캐주얼"],
    image: require("../../assets/images/stylink_mockup/admin1_profile.webp"),
    likes: 240,
    reviews: 56,
  },
  {
    id: "3",
    name: "admin2",
    categories: ["페미닌", "미니멀"],
    image: require("../../assets/images/stylink_mockup/admin2_profile.jpg"),
    likes: 310,
    reviews: 81,
  },
  {
    id: "4",
    name: "admin3",
    categories: ["댄디", "캐주얼", "아메카지"],
    image: require("../../assets/images/stylink_mockup/admin3_profile.jpeg"),
    likes: 0,
    reviews: 0,
  },
  {
    id: "5",
    name: "admin7",
    categories: ["빈티지", "캐주얼"],
    image: require("../../assets/images/stylink_mockup/admin7_profile.jpg"),
    likes: 98,
    reviews: 21,
  },

  {
    id: "6",
    name: "admin4",
    categories: ["미니멀", "캐주얼"],
    image: require("../../assets/images/stylink_mockup/admin4_profile.webp"),
    likes: 100,
    reviews: 21,
  },

   {
    id: "8",
    name: "mark",
    categories: ["빈티지", "캐주얼"],
    image: require("../../assets/images/stylink_mockup/홍길동_profile.webp"),
    likes: 15,
    reviews: 21,
  },
];

const DEFAULT_RATINGS = [
  4.9, 4.8, 5.0, 4.7, 4.6, 4.9, 4.8, 4.7,
];

export const MOCK_STYLISTS: Stylist[] = BASE_STYLISTS.map(
  (stylist, index) => ({
    ...stylist,
    rating: DEFAULT_RATINGS[index],
    introduction: `${stylist.categories.join(
      ", "
    )} 스타일을 중심으로 개인의 취향과 라이프스타일에 어울리는 코디를 제안합니다.`,
    services: DEFAULT_SERVICES.map((service) => ({ ...service })),

    // 포트폴리오는 [id].tsx에서 백엔드 게시물 API로 가져옵니다.
    portfolios: [],
  })
);
