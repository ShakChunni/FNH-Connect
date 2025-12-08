import React from "react";
import { Stethoscope } from "lucide-react";
import MarriageFertility from "./MedicalInformation/MarriageFertility";
import ObstetricHistory from "./MedicalInformation/ObstetricHistory";
import PhysicalMeasurements from "./MedicalInformation/PhysicalMeasurements";
import BloodPressure from "./MedicalInformation/BloodPressure";
import MedicalHistory from "./MedicalInformation/MedicalHistory";
import CurrentVisit from "./MedicalInformation/CurrentVisit";
import TreatmentPlan from "./MedicalInformation/TreatmentPlan";

const MedicalInformation: React.FC = () => {
  return (
    <div id="medical" className="mb-4 sm:mb-4 md:mb-2">
      {/* Main Header */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border border-purple-200">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 bg-white rounded-lg shadow flex items-center justify-center border border-purple-200">
            <Stethoscope className="text-purple-600 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-purple-900 leading-tight mb-0.5 sm:mb-1">
              Medical Information
            </h3>
            <p className="text-purple-700/80 text-xs sm:text-sm font-medium leading-tight">
              Fertility and medical history details
            </p>
          </div>
        </div>
      </div>

      <MarriageFertility />
      <ObstetricHistory />
      <PhysicalMeasurements />
      <BloodPressure />
      <MedicalHistory />
      <CurrentVisit />
      <TreatmentPlan />
    </div>
  );
};

export default React.memo(MedicalInformation);
