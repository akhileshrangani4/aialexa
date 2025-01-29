import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from '@/lib/db';
import OpenAI from 'openai';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { RequiresHigherPlanError } from '@/lib/exceptions';
import { fileTypes as codeTypes } from '@/lib/validations/codeInterpreter';
import { fileTypes as searchTypes } from '@/lib/validations/fileSearch';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                // Validate user subscription
                const { user } = session;
                const subscriptionPlan = await getUserSubscriptionPlan(user.id);
                const count = await db.file.count({
                    where: { userId: user.id },
                });

                if (count >= subscriptionPlan.maxFiles) {
                    throw new RequiresHigherPlanError();
                }

                // Validate file extension
                const extension = pathname.split('.').pop()!;
                const validExtensions = [...codeTypes, ...searchTypes];
                if (!validExtensions.includes(extension)) {
                    throw new Error('Invalid file extension');
                }

                return {
                    allowedContentTypes: [
                        'application/pdf', 
                        'text/plain', 
                        'application/json',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                        'application/msword', // .doc
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                        'application/vnd.ms-excel', // .xls
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
                        'application/vnd.ms-powerpoint', // .ppt
                        'text/csv', // .csv
                        'text/markdown', // .md
                        'application/x-yaml', // .yaml
                        'text/yaml'
                    ],
                    tokenPayload: JSON.stringify({
                        userId: user.id,
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                const { userId } = JSON.parse(tokenPayload || '{}');
                
                // Get OpenAI config
                const openAIConfig = await db.openAIConfig.findUnique({
                    select: {
                        globalAPIKey: true,
                        id: true,
                    },
                    where: { userId }
                });

                if (!openAIConfig?.globalAPIKey) {
                    throw new Error("Missing OpenAI API key");
                }

                // Create OpenAI file
                const openai = new OpenAI({
                    apiKey: openAIConfig.globalAPIKey
                });

                const response = await fetch(blob.url);
                const buffer = await response.arrayBuffer();

                const openaiFile = await openai.files.create({
                    file: new File([buffer], blob.pathname, { type: blob.contentType }),
                    purpose: 'assistants'
                });

                // Save to database
                await db.file.create({
                    data: {
                        name: blob.pathname,
                        blobUrl: blob.url,
                        openAIFileId: openaiFile.id,
                        userId,
                    }
                });
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        console.error(error);
        if (error instanceof RequiresHigherPlanError) {
            return NextResponse.json({ error: "Requires Higher plan" }, { status: 402 });
        }
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
        );
    }
} 