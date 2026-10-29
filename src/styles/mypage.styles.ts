
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

  headerSide: {
    width: 36,
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Arial",
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
  },

  settingsButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  settingsIcon: {
    fontSize: 19,
    color: "#555555",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 24,
  },

  profileSection: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#EEEEEE",
    borderWidth: 1,
    borderColor: "#D9D9D9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 16,
  },

  avatarHead: {
    position: "absolute",
    top: 20,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#BDBDBD",
  },

  avatarBody: {
    position: "absolute",
    bottom: -12,
    width: 52,
    height: 43,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    backgroundColor: "#BDBDBD",
  },

  profileInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingRight: 8,
  },

  profileName: {
    fontFamily: "Arial",
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 6,
  },

  profileId: {
    fontFamily: "Arial",
    fontSize: 12,
    color: "#888888",
  },

  followStat: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
  },

  statNumber: {
    fontFamily: "Arial",
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 6,
  },

  statLabel: {
    fontFamily: "Arial",
    fontSize: 10,
    color: "#777777",
  },

  stylistButton: {
    height: 46,
    borderRadius: 9,
    backgroundColor: "#51478F",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  stylistButtonText: {
    fontFamily: "Arial",
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  stylistEditButton: {
  backgroundColor: "#ffffff",
  borderColor : "#222222",
  borderWidth: 1,
},

stylistEditButtonText: {
  color: "#222222",
},

  menuList: {
    backgroundColor: "#F7F7F7",
    borderRadius: 10,
    overflow: "hidden",
  },

  menuRow: {
    minHeight: 44,
    paddingLeft: 16,
    paddingRight: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6E6E6",
  },

  menuLabelArea: {
    flexDirection: "row",
    alignItems: "center",
  },

  menuIcon: {
    width: 18,
    fontFamily: "Arial",
    fontSize: 15,
    color: "#444444",
    textAlign: "center",
    marginRight: 5,
  },

  menuLabel: {
    fontFamily: "Arial",
    fontSize: 13,
    color: "#333333",
  },

  menuRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  menuCount: {
    fontFamily: "Arial",
    fontSize: 11,
    color: "#888888",
  },

  chevron: {
    fontFamily: "Arial",
    fontSize: 17,
    color: "#888888",
    marginLeft: 6,
  },
});
