// Utility functions for EditDataInfertility component

export const getTabColors = (color: string, isActive: boolean) => {
  const colorMap = {
    blue: isActive
      ? "bg-blue-600 text-white"
      : "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800",
    indigo: isActive
      ? "bg-indigo-600 text-white"
      : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800",
    purple: isActive
      ? "bg-purple-600 text-white"
      : "bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800",
    pink: isActive
      ? "bg-pink-600 text-white"
      : "bg-pink-50 text-pink-700 hover:bg-pink-100 hover:text-pink-800",
    emerald: isActive
      ? "bg-emerald-600 text-white"
      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800",
    amber: isActive
      ? "bg-amber-700 text-white"
      : "bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800",
  };
  return colorMap[color as keyof typeof colorMap] || colorMap.blue;
};
