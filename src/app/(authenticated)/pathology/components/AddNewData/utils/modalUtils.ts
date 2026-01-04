export function getTabColors(color: string, isActive: boolean): string {
  const colorMap: Record<string, { active: string; inactive: string }> = {
    blue: {
      active: "bg-blue-500 text-white shadow-lg",
      inactive: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    },
    indigo: {
      active: "bg-indigo-500 text-white shadow-lg",
      inactive: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    },
    purple: {
      active: "bg-purple-500 text-white shadow-lg",
      inactive: "bg-purple-50 text-purple-700 hover:bg-purple-100",
    },
    green: {
      active: "bg-green-500 text-white shadow-lg",
      inactive: "bg-green-50 text-green-700 hover:bg-green-100",
    },
  };

  const colors = colorMap[color] || colorMap.blue;
  return isActive ? colors.active : colors.inactive;
}
