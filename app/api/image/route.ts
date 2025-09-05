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
    const { prompt, amount = "1", resolution = "512x512" } = body;

    if (!userId) return new NextResponse("Unauthorized.", { status: 401 });
    if (!process.env.GEMINI_API_KEY)
      return new NextResponse("Gemini api key not configured.", {
        status: 500,
      });

    if (!prompt)
      return new NextResponse("Prompt is required.", { status: 400 });

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro)
      return new NextResponse("Free trial has expired.", { status: 403 });

    // Use Gemini to enhance the prompt for better image generation
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const enhancedPrompt = `Enhance this image generation prompt to be more detailed and specific: "${prompt}". Return only the enhanced prompt, no additional text.`;
    
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const enhancedText = response.text();

    // Use a free image generation service (Pixabay API or similar)
    // For now, we'll return a placeholder that can be replaced with actual image generation
    const imageData = {
      url: `https://picsum.photos/512/512?random=${Date.now()}`,
      prompt: enhancedText.trim()
    };

    if (!isPro) await increaseApiLimit();

    return NextResponse.json([imageData], { status: 200 });
  } catch (error: unknown) {
    console.error("[IMAGE_ERROR]: ", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}
