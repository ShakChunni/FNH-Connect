"use client";

import React from "react";
import { motion } from "framer-motion";

interface LoginLoadingProps {
  message?: string;
}

export function LoginLoading({
  message = "Authenticating...",
}: LoginLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 bg-fnh-blue rounded-full"
            animate={{
              y: ["0%", "-50%", "0%"],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        className="text-sm font-medium text-fnh-grey"
      >
        {message}
      </motion.p>
    </div>
  );
}
