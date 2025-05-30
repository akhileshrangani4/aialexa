import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next"

import { authOptions } from "@/lib/auth"
import { db } from '@/lib/db';
import OpenAI from 'openai';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { RequiresHigherPlanError } from '@/lib/exceptions';
import { fileTypes as codeTypes } from '@/lib/validations/codeInterpreter';
import { fileTypes as searchTypes } from '@/lib/validations/fileSearch';

// Update the configuration
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// To replicate bodyParser: false functionality, we don't need to do anything special
// in the App Router, as it doesn't use body parsing middleware by default

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return new Response("Unauthorized", { status: 403 })
        }

        // Validate user subscription plan
        const { user } = session
        const subscriptionPlan = await getUserSubscriptionPlan(user.id)
        const count = await db.file.count({
            where: {
                userId: user.id,
            },
        })

        if (count >= subscriptionPlan.maxFiles) {
            throw new RequiresHigherPlanError()
        }

        const formData = await request.formData();
        const uploadedfile = formData.get('file') as File;
        if (!uploadedfile) {
          return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const filename = uploadedfile.name;

        if (!filename) {
            return new Response('Missing filename', { status: 400 });
        }

        const validExtensions = [...codeTypes, ...searchTypes];
        if (!validExtensions.includes(filename.split('.').pop()!)) {
            return new Response(`Invalid file extension, check the documentation for more information.`, { status: 400 });
        }

        const bytes = await uploadedfile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (!request.body) {
            return new Response('Missing body', { status: 400 });
        }

        const blob = await put(filename, buffer, {
            access: 'public',
          });

        const openAIConfig = await db.openAIConfig.findUnique({
            select: {
                globalAPIKey: true,
                id: true,
            },
            where: {
                userId: session?.user?.id
            }
        })

        if (!openAIConfig?.globalAPIKey) {
            return new Response("Missing OpenAI API key. Add your API key in the Settings tab.", { status: 400, statusText: "Missing OpenAI API key" })
        }

        const openai = new OpenAI({
            apiKey: openAIConfig?.globalAPIKey
        })
        const openaiFile = await openai.files.create({
            file: new File([buffer], filename, { type: uploadedfile.type }),
            purpose: 'assistants'
          });

        await db.file.create({
            data: {
                name: filename,
                blobUrl: blob.url,
                openAIFileId: openaiFile.id,
                userId: session?.user?.id,
            }
        })

        return NextResponse.json({ url: blob.url }, { status: 201 });
    } catch (error) {
        console.error(error);
        if (error instanceof RequiresHigherPlanError) {
          return NextResponse.json({ error: "Requires Higher plan" }, { status: 402 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}