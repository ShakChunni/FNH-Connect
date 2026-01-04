import React from "react";
import { Building2 } from "lucide-react";
import PathologyHospitalSearch from "./PathologyHospitalSearch";
import PathologyHospitalDetails from "./PathologyHospitalDetails";
import { usePathologyHospitalData } from "../../../stores";

const PathologyHospitalInformation: React.FC = () => {
  const hospitalData = usePathologyHospitalData();

  const getHeaderBg = () => {
    return "from-blue-50 to-blue-100 border-blue-200";
  };

  const getDescription = () => {
    if (hospitalData.id)
      return "Hospital details have been auto-filled from our database.";
    if (hospitalData.name && hospitalData.name.length > 0)
      return "You are adding a new hospital. Please fill in all required details.";
    return "Search for a hospital or add a new one to the system.";
  };

  return (
    <div id="hospital" className="mt-2 sm:mt-0 mb-6 sm:mb-8 md:mb-10">
      <div
        className={`bg-linear-to-r ${getHeaderBg()} rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border transition-colors duration-300`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md shrink-0">
            <Building2 className={"text-blue-600"} size={28} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
                Hospital Information
              </h3>
            </div>
            <p className="text-blue-700 text-[11px] sm:text-xs font-medium leading-tight transition-colors duration-300 mt-1">
              {getDescription()}
            </p>
          </div>
        </div>
      </div>

      <PathologyHospitalSearch />
      <PathologyHospitalDetails />
    </div>
  );
};

export default React.memo(PathologyHospitalInformation);
