
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 44,
    justifyContent: "center",
  },
  backText: {
    color: "#333333",
    fontSize: 32,
    lineHeight: 36,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  imageSection: {
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 22,
  },
  imagePicker: {
    width: 150,
    height: 150,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "#E9E9E9",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imageIcon: {
    color: "#A7A7A7",
    fontSize: 42,
  },
  imageHint: {
    color: "#999999",
    fontSize: 12,
    marginTop: 4,
  },
  changeImageText: {
    color: "#5D4B96",
    fontSize: 12,
    marginTop: 8,
  },
  section: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#282828",
  },
  description: {
    fontSize: 11,
    color: "#999999",
    marginTop: 6,
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  tag: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: "#FFFFFF",
  },
  selectedTag: {
    borderColor: "#8B78E6",
    backgroundColor: "#F1EDFF",
  },
  tagText: {
    fontSize: 11,
    color: "#666666",
  },
  selectedTagText: {
    color: "#5D4B96",
    fontWeight: "600",
  },
  hashtagInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hashtagInput: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 12,
    color: "#333333",
  },
  addButton: {
    height: 40,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0ECFA",
    borderRadius: 8,
  },
  addButtonText: {
    color: "#5D4B96",
    fontSize: 12,
    fontWeight: "600",
  },
  hashtagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
  },
  hashtagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F3F0FA",
    borderRadius: 14,
  },
  hashtagText: {
    fontSize: 11,
    color: "#5D4B96",
  },
  submitButton: {
    marginTop: 28,
    borderRadius: 9,
    overflow: "hidden",
  },
  submitGradient: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerText: {
    color: "#A5A5A5",
    fontSize: 10,
    textAlign: "center",
    marginTop: 12,
  },
});

export default styles;
