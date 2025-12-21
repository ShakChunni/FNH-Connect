import React, { memo } from "react";

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Allow any standard input props
}

const NumberInput = memo<NumberInputProps>(
  ({ onWheel, onKeyDown, ...props }) => {
    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      // Prevent the input value change on scroll by blurring the input
      e.currentTarget.blur();
      e.stopPropagation();

      // Call original onWheel if provided
      if (onWheel) {
        onWheel(e);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Block 'e', 'E', '+', '-' characters that are normally allowed in number inputs
      // but unwanted in financial/quantity fields
      if (["e", "E", "+", "-"].includes(e.key)) {
        e.preventDefault();
      }

      // Call original onKeyDown if provided
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    return (
      <input
        type="number"
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";

export default NumberInput;
