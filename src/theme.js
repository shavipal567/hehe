
export const cardShadow = {
  shadowColor: "#B4568A",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.12,
  shadowRadius: 14,
  elevation: 4,
};

const lightTheme = {
  primary: "#F2578D",
  secondary: "#7FB8E8",
  text: "#3A2E45",
  muted: "#9A7E93",
  cardBg: "rgba(255,255,255,0.82)",
  cardBorder: "rgba(255,255,255,0.9)",
  danger: "#F65C6C",
  success: "#4CD787",
};

const darkTheme = {
  primary: "#FF7AAE",
  secondary: "#8FCBFF",
  text: "#F3ECFA",
  muted: "#B79FC9",
  cardBg: "rgba(30,24,44,0.78)",
  cardBorder: "rgba(255,255,255,0.10)",
  danger: "#FF8A93",
  success: "#6FE0A8",
};

export function getTheme(darkMode) {
  return darkMode ? darkTheme : lightTheme;
}

// Kept for any code that still imports the static default (light) theme.
export const theme = lightTheme;

export const SUBJECT_PALETTE = [
  "#F2578D", // pink
  "#7FB8E8", // sky blue
  "#B497E8", // lavender
  "#F6B93C", // soft gold
  "#4CD787", // mint
  "#FF9EC4", // bubblegum
];

export const BACKGROUND_PALETTES = [
  {
    id: "pinkDusk",
    label: "Pink Dusk",
    swatch: ["#FFE4EF", "#E0EEFF"],
    gradient: ["#FFE4EF", "#FBE0EE", "#EDE3FB", "#E0EEFF"],
    blobPink: "rgba(255,158,196,0.35)",
    blobBlue: "rgba(127,184,232,0.30)",
    blobLavender: "rgba(180,151,232,0.20)",
    hillFar: "rgba(180,151,232,0.22)",
    hillNear: "rgba(127,184,232,0.28)",
  },
  {
    id: "oceanBlue",
    label: "Ocean Blue",
    swatch: ["#D6EAFF", "#8FD3E8"],
    gradient: ["#EAF6FF", "#D6EAFF", "#BFE6F2", "#8FD3E8"],
    blobPink: "rgba(143,211,232,0.30)",
    blobBlue: "rgba(90,160,220,0.35)",
    blobLavender: "rgba(150,210,230,0.22)",
    hillFar: "rgba(90,140,200,0.20)",
    hillNear: "rgba(60,150,180,0.28)",
  },
  {
    id: "lavenderNight",
    label: "Lavender Night",
    swatch: ["#E3D9FA", "#6E5A9E"],
    gradient: ["#EFE6FB", "#D8C7F2", "#B49CDE", "#7A5FA8"],
    blobPink: "rgba(200,160,230,0.30)",
    blobBlue: "rgba(120,90,170,0.35)",
    blobLavender: "rgba(170,140,220,0.25)",
    hillFar: "rgba(90,70,140,0.30)",
    hillNear: "rgba(60,45,110,0.35)",
  },
  {
    id: "sunsetPeach",
    label: "Sunset Peach",
    swatch: ["#FFE0C2", "#FF9E9E"],
    gradient: ["#FFF0DC", "#FFE0C2", "#FFC9B8", "#FF9E9E"],
    blobPink: "rgba(255,180,140,0.35)",
    blobBlue: "rgba(255,158,158,0.30)",
    blobLavender: "rgba(255,210,170,0.22)",
    hillFar: "rgba(230,140,120,0.22)",
    hillNear: "rgba(220,110,110,0.28)",
  },
  {
    id: "mintFresh",
    label: "Mint Fresh",
    swatch: ["#DFF7EA", "#8FE0C2"],
    gradient: ["#F0FBF4", "#DFF7EA", "#C4EFDA", "#8FE0C2"],
    blobPink: "rgba(180,230,200,0.30)",
    blobBlue: "rgba(130,210,190,0.30)",
    blobLavender: "rgba(160,225,205,0.22)",
    hillFar: "rgba(100,180,150,0.22)",
    hillNear: "rgba(70,160,130,0.28)",
  },
];

// Used automatically whenever dark mode is on, regardless of which light
// palette is selected — dark mode is a separate override, not a 6th swatch.
export const DARK_BACKGROUND_PALETTE = {
  id: "darkNight",
  label: "Dark",
  swatch: ["#1E1830", "#0D0B16"],
  gradient: ["#241B36", "#1B1428", "#140F20", "#0D0B16"],
  blobPink: "rgba(255,122,174,0.18)",
  blobBlue: "rgba(143,203,255,0.14)",
  blobLavender: "rgba(180,151,232,0.14)",
  hillFar: "rgba(80,60,120,0.35)",
  hillNear: "rgba(40,30,70,0.55)",
};

export function getBackgroundPalette(id, darkMode) {
  if (darkMode) return DARK_BACKGROUND_PALETTE;
  return BACKGROUND_PALETTES.find((p) => p.id === id) || BACKGROUND_PALETTES[0];
}
