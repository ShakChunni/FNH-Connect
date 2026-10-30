export function getTabColors(color: string, isActive: boolean): string {
  // Active tabs use 600+ fills so white text meets contrast on light surfaces.
  const colorMap: Record<string, { active: string; inactive: string }> = {
    blue: {
      active: "bg-blue-600 text-white",
      inactive: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    },
    indigo: {
      active: "bg-indigo-600 text-white",
      inactive: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    },
    purple: {
      active: "bg-purple-600 text-white",
      inactive: "bg-purple-50 text-purple-700 hover:bg-purple-100",
    },
    green: {
      active: "bg-emerald-700 text-white",
      inactive: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    },
  };

  const colors = colorMap[color] || colorMap.blue;
  return isActive ? colors.active : colors.inactive;
}
