import React from "react";
import { Building2 } from "lucide-react";
import HospitalSearch from "./HospitalInformation/HospitalSearch";
import HospitalDetails from "./HospitalInformation/HospitalDetails";
import { HospitalData as SharedHospitalData } from "../../app/(staff)/infertility/types";
import { useInfertilityHospitalData } from "../../app/(staff)/infertility/stores";

// Re-export shared type
export type HospitalData = SharedHospitalData;

// We keep the Props interface but make them optional or unused if we can't fully remove them yet
// without breaking the parent which we haven't edited yet.
// However, the user said "no other props or anything".
// Since I am also tasked to "Update Parent Components", I will eventually remove these props from Parent.
// For now, I will define the component as taking no props (or ignoring them).
const HospitalInformation: React.FC = () => {
  const hospitalData = useInfertilityHospitalData();

  // Derived state for header styling
  const getHeaderBg = () => {
    // If it's a new hospital (has name but no ID? or just use blue always?)
    // Existing logic: if status === 'new' -> blue.
    // We'll just stick to the standard blue theme for this section.
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
              <h3 className="text-md sm:text-lg md:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
                Hospital Information
              </h3>
            </div>
            <p className="text-blue-700 text-xs sm:text-sm font-medium leading-tight transition-colors duration-300 mt-1">
              {getDescription()}
            </p>
          </div>
        </div>
      </div>

      <HospitalSearch />
      <HospitalDetails />
    </div>
  );
};

export default React.memo(HospitalInformation);
