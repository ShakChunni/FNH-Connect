import React from "react";
import { FaPhoneVolume } from "react-icons/fa"; // Changed to ringing phone icon

interface CallCardProps {
  data: {
    type: string;
    quantity: number;
    timeSpent: number;
    count: number;
  }[];
}

const CallCard: React.FC<CallCardProps> = ({ data }) => {
  // Calculate total calls by summing quantities of "Call" entries
  const totalCalls = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return 0;

    return data.reduce((sum, item) => {
      if (item.type && item.type.toLowerCase().includes("call")) {
        return sum + (item.quantity || 0);
      }
      return sum;
    }, 0);
  }, [data]);

  return (
    <div className="relative overflow-hidden bg-[#F28E5C] rounded-3xl shadow-lg p-6 min-h-[180px] h-full flex flex-col justify-center">
      {/* Changed position to stay inside box at top right */}
      <div className="absolute right-2 top-2 text-[#fff] opacity-20">
        <FaPhoneVolume size={140} />
      </div>

      <div className="relative z-10">
        <h3 className="text-white text-sm sm:text-base md:text-lg font-medium mb-3">
          Total Number of Calls
        </h3>
        <p className="text-white text-2xl sm:text-3xl md:text-4xl font-bold">
          {totalCalls}
        </p>
      </div>
    </div>
  );
};

export default CallCard;