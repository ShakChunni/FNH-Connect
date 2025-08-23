import React, { useState, useCallback, memo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ContactEmailInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
  isAutofilled?: boolean;
}

const ContactEmailInput: React.FC<ContactEmailInputProps> = memo(
  ({
    value,
    onChange,
    onValidationChange,
    placeholder = "Enter email address",
    isAutofilled = false,
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
        if (!email || !email.trim()) {
          setIsValid(true);
          setErrorMessage("");
          if (onValidationChange) onValidationChange(true);
          return;
        }
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
        if (email.split("@").length > 2) {
          setIsValid(false);
          setErrorMessage("Email cannot contain multiple @ symbols");
          if (onValidationChange) onValidationChange(false);
          return;
        }
        if (domainPart.indexOf(".") === -1) {
          setIsValid(false);
          setErrorMessage("Email domain must include an extension (like .com)");
          if (onValidationChange) onValidationChange(false);
          return;
        }
        const extension = domainPart.split(".").pop();
        if (extension && extension.length < 2) {
          setIsValid(false);
          setErrorMessage("Domain extension is too short");
          if (onValidationChange) onValidationChange(false);
          return;
        }
        if (email.includes(" ")) {
          setIsValid(false);
          setErrorMessage("Email cannot contain spaces");
          if (onValidationChange) onValidationChange(false);
          return;
        }
        const emailRegex =
          /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        const isValidEmail = emailRegex.test(email);
        if (!isValidEmail) {
          setIsValid(false);
          setErrorMessage("Please enter a valid email address");
          if (onValidationChange) onValidationChange(false);
          return;
        }
        setIsValid(true);
        setErrorMessage("");
        if (onValidationChange) onValidationChange(true);
      },
      [onValidationChange]
    );

    useEffect(() => {
      setLocalValue(value || "");
      if (value && value.trim()) {
        setHasUserInput(true);
        setIsTouched(true);
        validateEmail(value);
        setShowValidation(true);
      } else {
        setHasUserInput(false);
        setIsTouched(false);
        setShowValidation(false);
      }
    }, [value, validateEmail]);

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        setHasUserInput(true);
        // If empty or just spaces, pass empty string to parent
        if (!newValue.trim()) {
          onChange("");
          validateEmail("");
          return;
        }
        onChange(newValue.trim());
        validateEmail(newValue.trim());
      },
      [onChange, validateEmail]
    );

    const handleInputBlur = useCallback(() => {
      const trimmedValue = localValue.trim();
      setLocalValue(trimmedValue);
      onChange(trimmedValue);
      validateEmail(trimmedValue);
      setIsTouched(true);
      setShowValidation(true);
    }, [localValue, onChange, validateEmail]);

    // Styling based on autofill or user interaction
    const shouldShowValidation = isTouched && showValidation;
    const shouldShowSuccess =
      (isAutofilled || (isTouched && hasUserInput)) &&
      isValid &&
      localValue.trim().length > 0;
    const shouldShowError = shouldShowValidation && !isValid;

    return (
      <div className="relative w-full">
        <input
          type="email"
          className={`
            flex-1 px-3 py-2 rounded-lg text-[#2A3136] outline-none h-14 font-normal 
            text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm
            placeholder:text-gray-400 placeholder:font-light w-full
            ${
              isAutofilled
                ? "bg-green-50 border-2 border-green-300"
                : shouldShowSuccess
                ? "bg-white border border-green-700 ring-1 ring-green-700"
                : shouldShowError
                ? "bg-gray-50 border-2 border-red-700 ring-2 ring-red-700"
                : "bg-gray-50 border-2 border-gray-300"
            }
            focus:border-blue-900 focus:ring-2 focus:ring-blue-950
            shadow-sm hover:shadow-md transition-all duration-300
          `}
          placeholder={placeholder}
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setShowValidation(false)}
        />

        <AnimatePresence>
          {shouldShowValidation && !isValid && (
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
