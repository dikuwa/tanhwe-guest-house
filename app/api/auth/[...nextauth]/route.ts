import { auth } from "@/lib/auth";
import { handler } from "better-auth/next";

export const { GET, POST } = handler(auth);