import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Mock API - just return success
    console.log("Transaction created:", body);
    
    return NextResponse.json(
      { 
        success: true, 
        id: `t${Date.now()}`,
        ...body 
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

