import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "5%",
    paddingBottom: 30,
  },
  logo: {
    width: 120,
    height: 108,
    marginBottom: 24,
  },
  title: {
    fontFamily: "Arial",
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },
  description: {
    marginTop: 9,
    fontFamily: "Arial",
    fontSize: 11,
    lineHeight: 17,
    color: "#999999",
    textAlign: "center",
  },
});

export default styles;
