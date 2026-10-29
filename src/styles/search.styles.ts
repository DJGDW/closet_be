
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
    height: 54,
    paddingHorizontal: 20,
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#171717",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },

  searchBox: {
    flex: 1,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: "#F4F4F4",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: "#222222",
    paddingVertical: 0,
  },

  filterButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
  },

  categoryArea: {
    height: 43,
    marginBottom: 4,
  },

  categoryList: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },

  categoryChip: {
    height: 33,
    paddingHorizontal: 13,
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E4E4E4",
    backgroundColor: "#FFFFFF",
  },

  categoryChipActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },

  categoryText: {
    fontSize: 12,
    color: "#555555",
    fontWeight: "500",
  },

  categoryTextActive: {
    color: "#FFFFFF",
  },

  resultHeader: {
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  resultTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222222",
  },

  resultCount: {
    marginTop: 3,
    fontSize: 12,
    color: "#888888",
  },

  refreshButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  // 피드와 같은 2열 이미지 카드
  gridContent: {
    paddingHorizontal: 7,
    paddingTop: 1,
    paddingBottom: 28,
    flexGrow: 1,
  },

  gridRow: {
    gap: 3,
    marginBottom: 3,
  },

  postCard: {
    width: "48.8%",
    aspectRatio: 0.76,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#F2F2F2",
  },

  postImageButton: {
  height: 220,
  position: "relative",
  backgroundColor: "#EEEEEE",
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

  // 피드와 동일한 하단 프로필 및 스타일 정보
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

  // 상세 필터 바텀시트
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  modalOutside: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  modalContent: {
    maxHeight: "88%",
    paddingTop: 9,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#D0D0D0",
    marginBottom: 18,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#222222",
  },

  sectionTitle: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#333333",
  },

  selectionHint: {
    marginBottom: 12,
    fontSize: 11,
    color: "#888888",
  },

  filterCategoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 9,
  },

  filterCategoryChip: {
    width: "31.5%",
    minHeight: 34,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },

  filterCategoryChipActive: {
    borderColor: PURPLE,
    backgroundColor: "#F0EEFA",
  },

  filterCategoryText: {
    fontSize: 11,
    color: "#555555",
    textAlign: "center",
  },

  filterCategoryTextActive: {
    color: PURPLE,
    fontWeight: "700",
  },

  selectAllButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 4,
  },

  selectAllText: {
    fontSize: 12,
    color: PURPLE,
    fontWeight: "600",
  },

  modalDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginTop: 18,
    marginBottom: 18,
  },

  sortOption: {
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sortOptionText: {
    fontSize: 13,
    color: "#333333",
  },

  modalHint: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 17,
    color: "#999999",
  },

  modalButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },

  resetModalButton: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
  },

  resetModalButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333333",
  },

  applyButton: {
    flex: 2,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: PURPLE,
  },

  applyButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default styles;
