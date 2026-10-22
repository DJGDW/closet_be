import { StyleSheet } from "react-native";

export const COLORS = {
  background: "#FFFFFF",
  text: "#222222",
  subText: "#777777",
  border: "#EEEEEE",
  placeholder: "#F2F2F2",
  purple: "#8B5CF6",
  subpurple: "#4d458b"
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
    height: 76,
    paddingLeft: 12,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },

  logoArea: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  logoImage: {
    width: 125,
    height: 38,
    alignSelf: "flex-start",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 17,
  },

  headerIconButton: {
    width: 28,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  feedScroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  feedContent: {
    paddingHorizontal: 7,
    paddingTop: 1,
    paddingBottom: 14,
  },

  feedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    columnGap: 3,
    rowGap: 3,
  },

  postCard: {
    width: "48.8%",
    marginBottom: 1,
    position: "relative",
    overflow: "hidden",
  },

  postImage: {
    width: "100%",
    aspectRatio: 0.76,
    borderColor: "#D5D5D5",
    backgroundColor: COLORS.placeholder,
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

  stylistProfileImage: {
    width: 30,
    height: 30,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  stylistTextArea: { flex: 1, minWidth: 0, justifyContent: "center" },
  stylistName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  stylistStyle: { color: "#FFFFFF", fontSize: 10, fontWeight: "400" },

  bottomNav: {
    height: 66,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 15,
  },

  navItem: {
    width: 52,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
