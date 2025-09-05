import { auth } from "@clerk/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { increaseApiLimit, checkApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();

    const body = await req.json();
    const { messages } = body;

    if (!userId) return new NextResponse("Unauthorized.", { status: 401 });
    if (!process.env.GEMINI_API_KEY)
      return new NextResponse("Gemini api key not configured.", {
        status: 500,
      });

    if (!messages)
      return new NextResponse("Messages are required.", { status: 400 });

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro)
      return new NextResponse("Free trial has expired.", { status: 403 });

    // Convert messages to Gemini format with code generation instruction
    const lastMessage = messages[messages.length - 1];
    const prompt = `You are a code generator. You must answer only in markdown code snippets. Use code comments for explanation. User request: ${lastMessage.content}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!isPro) await increaseApiLimit();

    return NextResponse.json({ content: text, role: "assistant" }, { status: 200 });
  } catch (error: unknown) {
    console.error("[CODE_ERROR]: ", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}
