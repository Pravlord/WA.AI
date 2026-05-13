export type PreferencesSectionId = "general" | "appearance";

export const PREFERENCES_SECTIONS: {
  id: PreferencesSectionId;
  label: string;
  description: string;
}[] = [
  {
    id: "general",
    label: "General",
    description: "Startup and workspace behavior."
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Themes and typography."
  }
];
