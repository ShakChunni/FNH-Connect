import React, { useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ContactEmailInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
}

const ContactEmailInput: React.FC<ContactEmailInputProps> = memo(
  ({
    value,
    onChange,
    onValidationChange,
    placeholder = "Enter email address",
  }) => {
    const [localValue, setLocalValue] = useState<string>(value || "");
    const [isValid, setIsValid] = useState<boolean>(true);
    const [isTouched, setIsTouched] = useState<boolean>(false);
    const [showValidation, setShowValidation] = useState<boolean>(false);
    const [hasUserInput, setHasUserInput] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    // Enhanced email validation
    const validateEmail = useCallback(
      (email: string) => {
        // If empty, don't mark as invalid
        if (!email || !email.trim()) {
          setIsValid(true);
          setErrorMessage("");
          if (onValidationChange) onValidationChange(true);
          return;
        }

        // Common validation issues
        if (email.indexOf("@") === -1) {
          setIsValid(false);
          setErrorMessage("Email must contain an @ symbol");
          if (onValidationChange) onValidationChange(false);
          return;
        }

        if (email.indexOf(".") === -1) {
          setIsValid(false);
          setErrorMessage("Email must contain a domain (like .com)");
          if (onValidationChange) onValidationChange(false);
          return;
        }

        const [localPart, domainPart] = email.split("@");

        if (!localPart || localPart.length === 0) {
          setIsValid(false);
          setErrorMessage("Email username cannot be empty");
          if (onValidationChange) onValidationChange(false);
          return;
        }

        if (!domainPart || domainPart.length === 0) {
          setIsValid(false);
          setErrorMessage("Email domain cannot be empty");
          if (onValidationChange) onValidationChange(false);
          return;
        }

        // Check for multiple @ symbols
        if (email.split("@").length > 2) {
          setIsValid(false);
          setErrorMessage("Email cannot contain multiple @ symbols");
          if (onValidationChange) onValidationChange(false);
          return;
        }

        // Check domain has at least one dot
        if (domainPart.indexOf(".") === -1) {
          setIsValid(false);
          setErrorMessage("Email domain must include an extension (like .com)");
          if (onValidationChange) onValidationChange(false);
          return;
        }

        // Domain extension shouldn't be too short
        const extension = domainPart.split(".").pop();
        if (extension && extension.length < 2) {
          setIsValid(false);
          setErrorMessage("Domain extension is too short");
          if (onValidationChange) onValidationChange(false);
          return;
        }

        // Check for spaces (usually not allowed in emails)
        if (email.includes(" ")) {
          setIsValid(false);
          setErrorMessage("Email cannot contain spaces");
          if (onValidationChange) onValidationChange(false);
          return;
        }

        // Final regex check for general format
        // This is a more comprehensive regex that covers most valid email formats
        const emailRegex =
          /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        const isValidEmail = emailRegex.test(email);

        if (!isValidEmail) {
          setIsValid(false);
          setErrorMessage("Please enter a valid email address");
          if (onValidationChange) onValidationChange(false);
          return;
        }

        // If we got here, the email is valid
        setIsValid(true);
        setErrorMessage("");
        if (onValidationChange) onValidationChange(true);
      },
      [onValidationChange]
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        setHasUserInput(true);

        // Check if input is just spaces or empty
        if (!newValue.trim()) {
          // If empty or just spaces, pass empty string to parent
          onChange("");
          validateEmail("");
          return;
        }

        // Only update parent with trimmed value
        onChange(newValue.trim());
        validateEmail(newValue.trim());
      },
      [onChange, validateEmail]
    );

    const handleInputBlur = useCallback(() => {
      // On blur, trim all excess spaces and normalize the email
      const trimmedValue = localValue.trim();
      setLocalValue(trimmedValue); // Update display value without spaces
      onChange(trimmedValue); // Update parent value
      validateEmail(trimmedValue); // Validate with trimmed value
      setIsTouched(true);
      setShowValidation(true);
    }, [localValue, onChange, validateEmail]);

    return (
      <div className="relative w-full">
        <input
          type="email"
          className={`
            flex-1 px-3 py-2 rounded-lg bg-gray-50 text-[#2A3136] outline-none h-14 font-normal 
            text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm
            placeholder:text-gray-400 placeholder:font-light w-full
            ${
              isTouched && showValidation
                ? isValid && hasUserInput && localValue.trim().length > 0
                  ? "border border-green-700 ring-1 ring-green-700"
                  : !isValid
                  ? "border-red-700 border ring-2 ring-red-700"
                  : "border border-gray-300"
                : "border border-gray-300"
            }
            focus:border-blue-900 focus:ring-2 focus:ring-blue-950
            shadow-sm hover:shadow-md transition-shadow duration-300
          `}
          placeholder={placeholder}
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setShowValidation(false)}
        />

        <AnimatePresence>
          {isTouched && showValidation && !isValid && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{
                duration: 0.2,
                ease: "easeInOut",
              }}
              className="overflow-hidden"
            >
              <p className="text-red-600 text-xs mt-1">
                {errorMessage || "Please enter a valid email address"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
ContactEmailInput.displayName = "ContactEmailInput";

export default ContactEmailInput;
