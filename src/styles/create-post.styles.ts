import { StyleSheet } from "react-native";

const PURPLE = "#51478F";

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
    paddingBottom: 24,
  },
  imageSection: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 22,
  },
  imagePicker: {
    width: 194,
    height: 212,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "#E9E9E9",
    borderWidth: 1,
    borderColor: "#D9D9D9",
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
  changeImageText: {
    color: PURPLE,
    fontSize: 12,
    marginTop: 8,
  },
  section: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  sectionFirst: {
    paddingTop: 0,
    borderTopWidth: 0,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
  },
  sectionHint: {
    fontSize: 11,
    color: "#999999",
  },
  description: {
    fontSize: 11,
    color: "#999999",
    marginTop: 6,
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    height: 31,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  selectedTag: {
    borderColor: PURPLE,
    backgroundColor: "#EFEDFA",
  },
  tagText: {
    fontSize: 12,
    color: "#555555",
  },
  selectedTagText: {
    color: "#3F3680",
    fontWeight: "700",
  },
  bodyTagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  bodyTag: {
    width: "32%",
    height: 30,
    paddingHorizontal: 4,
  },
  bodyTagText: {
    fontSize: 10.5,
    textAlign: "center",
  },
  hashtagInputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    marginTop: 10,
    paddingLeft: 12,
    paddingRight: 7,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  hashtagInput: {
    flex: 1,
    minWidth: 0,
    height: 42,
    paddingHorizontal: 0,
    fontSize: 12,
    color: "#333333",
  },
  addButton: {
    width: 52,
    height: 29,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EDEBF7",
    borderRadius: 6,
  },
  addButtonText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: "700",
  },
  hashtagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  hashtagChip: {
    height: 29,
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: "#EEEEEE",
    borderRadius: 15,
  },
  hashtagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#222222",
  },
  hashtagRemoveBadge: {
    position: "absolute",
    top: -5,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6D5BD0",
  },
  hashtagRemoveText: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
  },
  submitButton: {
    height: 50,
    borderRadius: 8,
    backgroundColor: PURPLE,
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
    fontSize: 15,
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
    marginTop: 10,
  },
});

export default styles;
