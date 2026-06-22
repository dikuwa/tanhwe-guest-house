import { NextResponse } from "next/server";
import { signInWithCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await signInWithCredentials(email, password);

    if (!result) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { user: result.user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { error: "An error occurred during sign in" },
      { status: 500 }
    );
  }
}