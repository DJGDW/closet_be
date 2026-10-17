import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  countRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 10,
  },
  countLabel: {
    fontFamily: "Arial",
    fontSize: 10,
    color: "#777777",
    marginRight: 3,
  },
  count: {
    fontFamily: "Arial",
    fontSize: 10,
    color: "#222222",
    fontWeight: "700",
  },
  countNumber: {
    color: "#51478C",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 9,
  },
  option: {
    width: "31.5%",
    height: 34,
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 3,
  },
  optionSelected: {
    backgroundColor: "#E8E8E8",
    borderColor: "#8275E8",
  },
  optionText: {
    fontFamily: "Arial",
    fontSize: 10,
    color: "#555555",
    textAlign: "center",
  },
  optionTextSelected: {
    color: "#4d458b",
    fontWeight: "700",
  },
  helperText: {
    marginTop: 22,
    fontFamily: "Arial",
    fontSize: 10,
    lineHeight: 16,
    color: "#AAAAAA",
  },
  footer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: "4.98%",
    paddingTop: 8,
    paddingBottom: 70,
    backgroundColor: "#FFFFFF",
  },
  previousButton: {
    width: 100,
    height: 47,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 9,
    backgroundColor: "#F2F2F2",
  },
  previousButtonText: {
    fontFamily: "Arial",
    fontSize: 14,
    color: "#444444",
  },
  nextButton: {
    flex: 1,
  },
});

export default styles;
