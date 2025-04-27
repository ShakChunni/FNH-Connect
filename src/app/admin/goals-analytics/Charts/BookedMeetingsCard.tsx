import React from "react";
import { FaCalendarCheck } from "react-icons/fa6";

interface BookedMeetingsCardProps {
  data: {
    type: string;
    quantity: number;
    timeSpent: number;
    count: number;
  }[];
}

const BookedMeetingsCard: React.FC<BookedMeetingsCardProps> = ({ data }) => {
  // Calculate total booked meetings by summing quantities of "Booked Meetings" entries
  const totalBookedMeetings = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return 0;

    return data.reduce((sum, item) => {
      if (item.type && item.type.toLowerCase().includes("meeting")) {
        return sum + (item.quantity || 0);
      }
      return sum;
    }, 0);
  }, [data]);
  return (
    <div className="relative overflow-hidden bg-[#85CE96] rounded-3xl shadow-lg p-6 min-h-[180px] h-full flex flex-col justify-center">
      {/* Changed position to stay inside box at top right */}
      <div className="absolute right-2 top-2 text-[#fff] opacity-20">
        <FaCalendarCheck size={140} />
      </div>

      <div className="relative z-10">
        <h3 className="text-white text-sm sm:text-base md:text-lg font-medium mb-3">
          Total Number of Booked Meetings
        </h3>
        <p className="text-white text-2xl sm:text-3xl md:text-4xl font-bold">
          {totalBookedMeetings}
        </p>
      </div>
    </div>
  );
};

export default BookedMeetingsCard;
