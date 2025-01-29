import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from '@/lib/db';
import OpenAI from 'openai';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { filename, url } = await request.json();

        // Get OpenAI config
        const openAIConfig = await db.openAIConfig.findUnique({
            select: {
                globalAPIKey: true,
                id: true,
            },
            where: { userId: session.user.id }
        });

        if (!openAIConfig?.globalAPIKey) {
            throw new Error("Missing OpenAI API key");
        }

        // Create OpenAI file
        const openai = new OpenAI({
            apiKey: openAIConfig.globalAPIKey
        });

        const response = await fetch(url);
        const buffer = await response.arrayBuffer();

        const openaiFile = await openai.files.create({
            file: new File([buffer], filename),
            purpose: 'assistants'
        });

        // Save to database
        const file = await db.file.create({
            data: {
                name: filename,
                blobUrl: url,
                openAIFileId: openaiFile.id,
                userId: session.user.id,
            }
        });

        return NextResponse.json(file);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
} 