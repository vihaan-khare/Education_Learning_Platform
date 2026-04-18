export const ROUTINE_FLOW = ["learn", "practice", "test"];

export function getRoutineLabel(mode) {
  if (mode === "learn") return "Learn";
  if (mode === "practice") return "Practice";
  return "Test";
}
