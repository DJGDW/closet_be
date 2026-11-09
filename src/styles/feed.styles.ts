
import { StyleSheet } from "react-native";

import { palette, radius } from "./theme";

export const COLORS = {
  background: palette.background,
  text: palette.text,
  subText: palette.textSub,
  border: palette.line,
  placeholder: palette.surface,
  purple: palette.primary,
  subpurple: palette.primary,
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
  },

  appFrame: {
    flex: 1,
    width: "100%",
    maxWidth: 402,
    backgroundColor: COLORS.background,
    overflow: "hidden",
  },

  header: {
    height: 58,
    paddingLeft: 16,
    paddingRight: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: palette.background,
  },

  logoArea: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  logoImage: {
    width: 105,
    height: 32,
    alignSelf: "flex-start",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },

  feedScroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  feedContent: {
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 24,
  },

  feedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 4,
  },

  postCard: {
    width: "49.4%",
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: palette.surface,
  },

  postImage: {
    width: "100%",
    aspectRatio: 0.59,
    backgroundColor: palette.line,
  },

  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "38%",
  },

  likeArea: {
    position: "absolute",
    right: 10,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    zIndex: 1,
  },
  likeCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  stylistInfo: {
    position: "absolute",
    left: 9,
    right: 62,
    bottom: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 2,
    elevation: 2,
  },

  stylistProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  stylistTextArea: { flex: 1, minWidth: 0, justifyContent: "center" },
  stylistName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 1,
  },
  stylistStyle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "500",
  },

  // 불러오는 중 / 오류 / 빈 화면
  stateWrap: {
    paddingTop: 96,
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  stateIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  stateText: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.textSub,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  bottomNav: {
    minHeight: 60,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingTop: 8,
    paddingHorizontal: 8,
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 2,
  },
  navLabel: {
    fontSize: 10.5,
    fontWeight: "500",
  },
  navLabelActive: {
    fontWeight: "700",
  },
});
