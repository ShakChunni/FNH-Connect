import { useEffect } from "react";
import { useInfertilityMedicalInfo, useInfertilityActions } from "../stores";

export const useInfertilityBMI = () => {
  const medicalInfo = useInfertilityMedicalInfo();
  const { updateMedicalInfo } = useInfertilityActions();

  useEffect(() => {
    if (medicalInfo.weight && medicalInfo.height) {
      const heightInMeters = medicalInfo.height / 100;
      const bmi = medicalInfo.weight / (heightInMeters * heightInMeters);
      const calculatedBmi = Math.round(bmi * 10) / 10;

      // Only update if BMI has actually changed to avoid infinite loops
      if (medicalInfo.bmi !== calculatedBmi) {
        updateMedicalInfo("bmi", calculatedBmi);
      }
    } else if (medicalInfo.bmi !== null) {
      // Clear BMI if weight or height is missing
      updateMedicalInfo("bmi", null);
    }
  }, [
    medicalInfo.weight,
    medicalInfo.height,
    medicalInfo.bmi,
    updateMedicalInfo,
  ]);
};
