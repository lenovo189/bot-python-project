import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(req: Request) {
    try {
        const { projectId, message } = await req.json();
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response("Unauthorized", { status: 401 });

        // 1. Fetch project context and user language
        const { data: profile } = await supabase.from('profiles').select('language').eq('id', user.id).single();
        const lang = profile?.language || 'en';

        const { data: project } = await supabase
            .from('projects')
            .select('name, description')
            .eq('id', projectId)
            .single();

        // 2. Generate Gemini response
        const langInstruction = lang === 'uz' ? "IMPORTANT: Respond ALWAYS in Uzbek." : "IMPORTANT: Respond ALWAYS in English.";
        const prompt = `${langInstruction}
    You are BloomGuard AI, a smart plant care assistant. 
    You are helping a user with their project: "${project?.name}". 
    Project Details: ${project?.description}.
    User says: ${message}`;

        let responseText = "Sorry, I'm having trouble connecting to my brain right now.";

        if (process.env.GEMINI_API_KEY) {
            const result = await model.generateContent(prompt);
            responseText = result.response.text();
        } else {
            responseText = "AI Response: I see you're asking about your plants! (Please set GEMINI_API_KEY to get real intelligence). I would recommend checking the moisture levels twice a day.";
        }

        // 3. Save AI message to Supabase
        const { error } = await supabase
            .from('messages')
            .insert({
                project_id: projectId,
                role: 'assistant',
                content: responseText
            });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
    }
}
