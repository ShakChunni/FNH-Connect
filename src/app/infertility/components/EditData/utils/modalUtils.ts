// Utility functions for EditDataInfertility component

export const getTabColors = (color: string, isActive: boolean) => {
  const colorMap = {
    blue: isActive
      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
      : "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800",
    indigo: isActive
      ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg"
      : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800",
    purple: isActive
      ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
      : "bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800",
    pink: isActive
      ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg"
      : "bg-pink-50 text-pink-700 hover:bg-pink-100 hover:text-pink-800",
    emerald: isActive
      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg"
      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800",
    amber: isActive
      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg"
      : "bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800",
  };
  return colorMap[color as keyof typeof colorMap] || colorMap.blue;
};
