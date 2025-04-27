import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

interface PercentageChangeProps {
  percentage: number;
  direction: "up" | "down";
  className?: string;
}

const PercentageChange: React.FC<PercentageChangeProps> = ({
  percentage,
  direction,
  className = "",
}) => {
  if (!isFinite(percentage) || isNaN(percentage)) {
    return null;
  }

  const isPositive = direction === "up";
  const textColor = isPositive ? "text-green-500" : "text-red-500";

  return (
    <div className={`flex items-center ${textColor} ${className}`}>
      {isPositive ? <FaArrowUp /> : <FaArrowDown />}
      <span className="ml-1">{percentage}%</span>
    </div>
  );
};

export default PercentageChange;
