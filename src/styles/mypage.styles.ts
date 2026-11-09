import { StyleSheet } from "react-native";

import { palette, radius } from "./theme";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },

  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 20,
    paddingRight: 12,
  },

  headerSide: {
    width: 40,
  },

  headerTitle: {
    flex: 1,
    textAlign: "left",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: palette.text,
  },

  settingsButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  settingsIcon: {
    fontSize: 19,
    color: palette.textSub,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
  },

  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.primarySoft,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: palette.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  avatarHead: {},
  avatarBody: {},

  profileInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingRight: 6,
  },

  profileName: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: palette.text,
    marginBottom: 3,
  },

  profileId: {
    fontSize: 13,
    color: palette.textMute,
  },

  roleBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
  },

  roleBadgeStylist: {
    backgroundColor: palette.primary,
  },

  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.textSub,
  },

  roleBadgeTextStylist: {
    color: "#FFFFFF",
  },

  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: palette.line,
    shadowColor: "#1A1A1F",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    marginBottom: 14,
  },

  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: "#D8D8E0",
  },

  followStat: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  statNumber: {
    fontSize: 17,
    fontWeight: "800",
    color: palette.text,
    marginBottom: 3,
  },

  statLabel: {
    fontSize: 11,
    color: palette.textSub,
  },

  stylistButton: {
    minHeight: 72,
    borderRadius: radius.lg,
    backgroundColor: palette.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: "hidden",
    marginBottom: 24,
  },

  stylistButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  stylistEditButton: {
    backgroundColor: palette.background,
    borderColor: palette.line,
    borderWidth: 1,
  },

  stylistEditButtonText: {
    color: palette.text,
  },

  stylistGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  stylistIconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  stylistIconTileEdit: {
    backgroundColor: palette.primarySoft,
  },

  stylistTextArea: {
    flex: 1,
  },

  stylistSubText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },

  stylistEditSubText: {
    color: palette.textSub,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.textSub,
    marginBottom: 10,
    marginLeft: 4,
  },

  menuList: {
    backgroundColor: palette.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: "hidden",
  },

  menuRow: {
    minHeight: 62,
    paddingLeft: 14,
    paddingRight: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
  },

  menuLabelArea: {
    flexDirection: "row",
    alignItems: "center",
  },

  menuIconTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  tileLike: {
    backgroundColor: "#FFEFF2",
  },

  tileBuy: {
    backgroundColor: palette.primarySoft,
  },

  tileSale: {
    backgroundColor: "#E8F6F0",
  },

  menuIcon: {
    width: 18,
    fontSize: 15,
    color: palette.textSub,
    textAlign: "center",
    marginRight: 5,
  },

  menuLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: palette.text,
  },

  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  menuCount: {
    minWidth: 24,
    textAlign: "center",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    fontSize: 12,
    fontWeight: "700",
    color: palette.textSub,
  },

  chevron: {
    fontSize: 17,
    color: palette.textMute,
    marginLeft: 6,
  },
});
