import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const origin = url.origin;
    
    // Serve standard ERC-8004 Agent Card JSON
    return NextResponse.json({
      name: "KIMO",
      description: "KIMO is a personal AI assistant on Celo that helps users manage stablecoin distributions and payroll.",
      image: `${origin}/kimo-logo.png`,
      type: "agent",
      services: [
        {
          type: "a2a",
          url: `${origin}/api/chat`
        }
      ],
      supportedTrust: [
        "reputation"
      ]
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error: any) {
    console.error('[KIMO Agent Metadata API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
