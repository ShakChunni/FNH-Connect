import { Button } from "@radix-ui/themes";
import React, { FC } from "react";

interface ResetButtonProps {
  onFilterChange: () => void;
}

const ResetButton: FC<ResetButtonProps> = ({ onFilterChange }) => {
  return (
    <Button
      onClick={onFilterChange}
      style={{
        backgroundColor: "red",
        color: "white",
        border: "1px solid #00000040",
        borderRadius: "10px",
        padding: "10px 20px",
        transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
        cursor: "pointer",
        height: "50px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#ff4d4d";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "red";
      }}
    >
      Reset
    </Button>
  );
};

export default ResetButton;
