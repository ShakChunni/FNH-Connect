import { z } from "zod";
import { validatePassword } from "./passwordPolicy";

export const newPasswordSchema = z.string().max(128).superRefine((password, ctx) => {
  for (const message of validatePassword(password).errors) {
    ctx.addIssue({ code: "custom", message });
  }
});
