
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  backButton: {
    width: 36,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  backIcon: {
    fontFamily: "Arial",
    fontSize: 32,
    lineHeight: 36,
    color: "#222222",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Arial",
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
  },

  headerSide: {
    width: 36,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
  },

  menuList: {
    width: "100%",
  },

  menuRow: {
    height: 54,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DCDCDC",
  },

  lastMenuRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  menuLabel: {
    fontFamily: "Arial",
    fontSize: 14,
    color: "#333333",
  },

  chevron: {
    fontFamily: "Arial",
    fontSize: 19,
    color: "#777777",
  },

  logoutButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  logoutText: {
    fontFamily: "Arial",
    fontSize: 13,
    color: "#FF4444",
  },
});
