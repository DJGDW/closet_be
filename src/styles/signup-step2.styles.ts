import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  required: {
    color: "#333333",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 13,
  },
  measurementInput: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontFamily: "Arial",
    fontSize: 13,
    color: "#333333",
  },
  unit: {
    fontFamily: "Arial",
    fontSize: 10,
    color: "#888888",
    marginLeft: 8,
  },
  infoBox: {
    minHeight: 55,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginTop: 1,
  },
  infoText: {
    fontFamily: "Arial",
    fontSize: 10,
    lineHeight: 17,
    color: "#777777",
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
  nextButton: { flex: 1 },
  
  previousButtonText: {
    fontFamily: "Arial",
    fontSize: 14,
    color: "#444444",
  },
});

export default styles;
