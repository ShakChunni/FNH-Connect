import { useState, useCallback, useEffect } from "react";

interface MetricVisibility {
  metric1Visible: boolean;
  metric2Visible: boolean;
  metric3Visible: boolean;
}

const getInitialState = (): MetricVisibility => {
  if (typeof window === "undefined") {
    return {
      metric1Visible: true,
      metric2Visible: true,
      metric3Visible: true,
    };
  }

  const savedMetric1 = localStorage.getItem("metric1Visible");
  const savedMetric2 = localStorage.getItem("metric2Visible");
  const savedMetric3 = localStorage.getItem("metric3Visible");

  return {
    metric1Visible: savedMetric1 ? JSON.parse(savedMetric1) : true,
    metric2Visible: savedMetric2 ? JSON.parse(savedMetric2) : true,
    metric3Visible: savedMetric3 ? JSON.parse(savedMetric3) : true,
  };
};

const useMetricVisibility = () => {
  const [visibility, setVisibility] =
    useState<MetricVisibility>(getInitialState);

  const toggleMetricVisibility = useCallback(
    (metricKey: keyof MetricVisibility) => {
      setVisibility((prev) => {
        const newState = { ...prev, [metricKey]: !prev[metricKey] };

        if (typeof window !== "undefined") {
          localStorage.setItem(metricKey, JSON.stringify(newState[metricKey]));
        }

        return newState;
      });
    },
    []
  );

  return {
    ...visibility,
    toggleMetricVisibility,
  };
};

export default useMetricVisibility;
