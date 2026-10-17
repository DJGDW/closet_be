import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  required: {
    color: "#333333",
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
  },
  genderOption: {
    flex: 1,
    height: 43,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 9,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  genderSelected: {
    borderColor: "#51478C",
  },
  radioOuter: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: "#777777",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#51478C",
  },
  genderText: {
    fontFamily: "Arial",
    fontSize: 12,
    color: "#444444",
  },
  actionRow: {
    flexDirection: "row",
    gap: 9,
  },
  actionInput: {
    flex: 1,
    minWidth: 0,
  },
  actionButton: {
    width: "27%",
    height: 43,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 9,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  actionButtonText: {
    fontFamily: "Arial",
    fontSize: 11,
    color: "#444444",
    textAlign: "center",
  },
  bottomSpacer: {
    height: 8,
  },
});

export default styles;
