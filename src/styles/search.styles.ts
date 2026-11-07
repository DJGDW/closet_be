import { StyleSheet } from "react-native";

const PURPLE = "#4D458B";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screenContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 38,
    paddingHorizontal: 20,
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#111111",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginTop: 10,
  },

  searchBox: {
    flex: 1,
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 23,
    backgroundColor: "#F4F4F4",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    color: "#222222",
    paddingVertical: 0,
  },

  // 한 줄 카테고리 칩 + 오른쪽 고정 필터 버튼
  categoryRow: {
    height: 34,
    marginTop: 13,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  categoryScroll: {
    flex: 1,
  },

  categoryList: {
    paddingLeft: 14,
    // 마지막 칩이 필터 버튼 밑에 가리지 않도록 오른쪽 여백 확보
    paddingRight: 110,
    alignItems: "center",
    gap: 7,
  },

  categoryChip: {
    height: 34,
    paddingHorizontal: 15,
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E4E4E4",
    backgroundColor: "#F3F3F3",
  },

  categoryChipActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },

  categoryText: {
    fontSize: 12,
    color: "#333333",
    fontWeight: "500",
  },

  categoryTextActive: {
    color: "#FFFFFF",
  },

  filterDock: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
  },

  filterFade: {
    width: 18,
  },

  filterDockSolid: {
    justifyContent: "center",
    paddingRight: 14,
    backgroundColor: "#FFFFFF",
  },

  filterButton: {
    height: 34,
    minWidth: 74,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: PURPLE,
    backgroundColor: "#F2EFFC",
  },

  filterButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#222222",
  },

  // 필터 적용 후 요약 줄
  appliedRow: {
    height: 30,
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  appliedChip: {
    height: 30,
    maxWidth: "65%",
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: PURPLE,
  },

  appliedChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },

  appliedSortText: {
    fontSize: 12,
    color: "#555555",
  },

  divider: {
    height: 1,
    backgroundColor: "#E6E6E6",
  },

  sectionLabel: {
    paddingTop: 8,
    paddingHorizontal: 18,
    marginBottom: 6,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#111111",
  },

  // 포트폴리오 2열 배치
  gridContent: {
    paddingBottom: 28,
  },

  gridRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 0,
    gap: 12,
  },

  gridColumn: {
    flex: 1,
    minWidth: 0,
    gap: 11,
  },

  postCard: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DEDEDE",
    backgroundColor: "#E8E8E8",
  },

  postImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "45%",
  },

  stylistInfo: {
    position: "absolute",
    left: 8,
    right: 6,
    bottom: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  profileCircle: {
    width: 30,
    height: 30,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  profileInitial: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  stylistTextArea: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  stylistName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },

  stylistStyle: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "400",
  },

  likeBadge: {
    position: "absolute",
    top: 9,
    right: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  likeCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  profileHitArea: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: 150,
    height: 58,
  },

  // 검색어에 맞는 스타일리스트
  profileListArea: {
    flexGrow: 0,
  },

  profileList: {
    paddingHorizontal: 18,
    paddingBottom: 6,
    gap: 17,
  },

  profileTile: {
    width: 81,
    height: 78,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#D9D9D9",
  },

  profileTileImage: {
    width: "100%",
    height: "100%",
  },

  // 결과 없음
  emptyState: {
    flex: 1,
    alignItems: "center",
    paddingTop: 100,
  },

  emptyCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    marginTop: 22,
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 40,
  },

  stateTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
  },

  stateDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#888888",
    textAlign: "center",
  },

  retryButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 9,
    backgroundColor: PURPLE,
  },

  retryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // 필터 바텀시트
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  modalOutside: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  modalContent: {
    height: "82%",
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D0D0D0",
  },

  modalTitle: {
    marginTop: 14,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
    color: "#111111",
  },

  sectionTitle: {
    marginTop: 11,
    marginBottom: 13,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: "#111111",
  },

  filterCategoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 9,
  },

  filterCategoryChip: {
    width: "31.5%",
    height: 33,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
  },

  filterCategoryChipActive: {
    borderColor: "#ABA3EB",
    backgroundColor: "#E8E7EF",
  },

  filterCategoryText: {
    fontSize: 12,
    color: "#222222",
    textAlign: "center",
  },

  filterCategoryTextActive: {
    color: "#222222",
    fontWeight: "600",
  },

  modalDivider: {
    height: 1,
    backgroundColor: "#E6E6E6",
    marginTop: 18,
    marginBottom: 4,
  },

  sortOption: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  sortOptionText: {
    fontSize: 14,
    color: "#222222",
  },

  applyButton: {
    marginTop: "auto",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: PURPLE,
  },

  applyButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default styles;
