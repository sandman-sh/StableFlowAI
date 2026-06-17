import { NextResponse } from 'next/server';
import { stableFlowAIChat } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { message, history, employees } = await request.json();
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    console.log(`[KIMO Chat API] Input message: "${message}", history length: ${history?.length || 0}`);
    
    const result = await stableFlowAIChat(message, history, apiKey, employees);
    
    console.log(`[KIMO Chat API] Output text length: ${result?.text?.length || 0}, proposal present: ${!!result?.proposal}`);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[KIMO Chat API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
