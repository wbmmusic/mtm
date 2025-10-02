// Legacy modalStyle - use mtmStyles.modal from theme/index.ts for new components
export const modalStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 2,
  userSelect: "none" as const,
};

// Re-export new theme-based styles for gradual migration
export { mtmStyles, mtmTheme } from './theme';