"use client";

import { Check, Copy, RefreshCw, WandSparkles } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { PASSWORD_POLICY, validatePassword } from "@/lib/passwordPolicy";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

interface PasswordGeneratorProps {
  disabled?: boolean;
  onGenerate: (password: string) => void;
  onError: (message: string) => void;
}

const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const NUMBERS = "23456789";

function getSecureRandomIndex(maxExclusive: number) {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi?.getRandomValues) {
    throw new Error("Secure password generation is not available.");
  }

  const values = new Uint32Array(1);
  cryptoApi.getRandomValues(values);
  return values[0] % maxExclusive;
}

function getRandomCharacter(characters: string) {
  return characters[getSecureRandomIndex(characters.length)];
}

function shuffleCharacters(characters: string[]) {
  const shuffled = [...characters];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = getSecureRandomIndex(index + 1);
    const current = shuffled[index];
    shuffled[index] = shuffled[randomIndex];
    shuffled[randomIndex] = current;
  }

  return shuffled.join("");
}

function generatePolicyCompliantPassword() {
  const requiredCharacters: string[] = [];

  if (PASSWORD_POLICY.REQUIRE_UPPERCASE) {
    requiredCharacters.push(getRandomCharacter(UPPERCASE));
  }

  if (PASSWORD_POLICY.REQUIRE_LOWERCASE) {
    requiredCharacters.push(getRandomCharacter(LOWERCASE));
  }

  if (PASSWORD_POLICY.REQUIRE_NUMBER) {
    requiredCharacters.push(getRandomCharacter(NUMBERS));
  }

  if (PASSWORD_POLICY.REQUIRE_SPECIAL) {
    requiredCharacters.push(getRandomCharacter(PASSWORD_POLICY.SPECIAL_CHARS));
  }

  const allCharacters = `${LOWERCASE}${UPPERCASE}${NUMBERS}${PASSWORD_POLICY.SPECIAL_CHARS}`;
  const passwordLength = Math.max(PASSWORD_POLICY.MIN_LENGTH, 16);
  const remainingLength = passwordLength - requiredCharacters.length;

  const randomCharacters = Array.from({ length: remainingLength }, () =>
    getRandomCharacter(allCharacters),
  );

  const password = shuffleCharacters([...requiredCharacters, ...randomCharacters]);
  const validation = validatePassword(password);

  if (!validation.valid) {
    throw new Error("Generated password did not meet the password policy.");
  }

  return password;
}

export function PasswordGenerator({
  disabled = false,
  onGenerate,
  onError,
}: PasswordGeneratorProps) {
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const passwordLengthLabel = useMemo(
    () => `${Math.max(PASSWORD_POLICY.MIN_LENGTH, 16)} characters`,
    [],
  );

  const handleGenerate = useCallback(() => {
    try {
      const password = generatePolicyCompliantPassword();
      setGeneratedPassword(password);
      setCopied(false);
      onGenerate(password);
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Failed to generate a secure password.",
      );
    }
  }, [onError, onGenerate]);

  const handleCopy = useCallback(async () => {
    if (!generatedPassword) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      onError("Failed to copy generated password.");
    }
  }, [generatedPassword, onError]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        disabled={disabled}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        title="Generate strong password"
        aria-label="Open password generator"
      >
        <WandSparkles className="h-4 w-4" />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        matchButtonWidth={false}
        className="w-[min(22rem,calc(100vw-2rem))]"
      >
        <div className="p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <WandSparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-fnh-navy-dark">
                Password Generator
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Creates a random {passwordLengthLabel} password with uppercase,
                lowercase, number, and special character.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={disabled}
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Generate and Fill
          </button>

          {generatedPassword ? (
            <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-2">
              <div className="flex items-center gap-2 rounded-md bg-white px-2 py-2">
                <code className="min-w-0 flex-1 break-all text-xs font-bold text-emerald-950">
                  {generatedPassword}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={disabled}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-emerald-100 px-2 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-2 text-[11px] font-medium text-emerald-800">
                This password has been filled into the new password fields.
              </p>
            </div>
          ) : null}
        </div>
      </DropdownPortal>
    </>
  );
}
