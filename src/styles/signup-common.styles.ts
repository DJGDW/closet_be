import { StyleSheet } from "react-native";

const common = StyleSheet.create({
  webBackground: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F2",
  },
  screen: {
    width: "100%",
    maxWidth: 402,
    aspectRatio: 402 / 874,
    backgroundColor: "#FFFFFF",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    height: 76,
    paddingHorizontal: "5%",
    paddingTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backIcon: {
    fontSize: 32,
    lineHeight: 34,
    color: "#222222",
    marginTop: -3,
  },
  headerTitle: {
    fontFamily: "Arial",
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
  stepText: {
    fontFamily: "Arial",
    fontSize: 12,
    color: "#777777",
  },
  progressRow: {
    flexDirection: "row",
    marginHorizontal: "5%",
    marginTop: 1,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#DDDDDD",
  },
  progressActive: {
    backgroundColor: "#8175E8",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: "4.98%",
    paddingTop: 12,
    paddingBottom: 12,
  },
  intro: {
    marginBottom: 30,
  },
  heading: {
    fontFamily: "Arial",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: "#111111",
  },
  description: {
    fontFamily: "Arial",
    fontSize: 11,
    lineHeight: 16,
    color: "#888888",
    marginTop: 3,
  },
  field: {
    marginBottom: 9,
  },
  label: {
    fontFamily: "Arial",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 7,
  },
  input: {
    height: 43,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 0,
    backgroundColor: "#FFFFFF",
    fontFamily: "Arial",
    fontSize: 13,
    color: "#333333",
  },
  inputError: {
    borderColor: "#E53935",
    borderWidth: 1,
  },
  errorText: {
    marginTop: 4,
    fontFamily: "Arial",
    fontSize: 10,
    lineHeight: 13,
    color: "#E53935",
  },
  footerBase: {
    paddingHorizontal: "4.98%",
    paddingTop: 8,
    paddingBottom: 70,
    backgroundColor: "#FFFFFF",
  },
  nextButton: {
    height: 47,
    borderRadius: 9,
    backgroundColor: "#51478C",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    fontFamily: "Arial",
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default common;
