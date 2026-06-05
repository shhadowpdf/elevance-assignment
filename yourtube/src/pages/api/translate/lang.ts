import { NextApiRequest, NextApiResponse } from "next/dist/shared/lib/utils";
import OpenAI from "openai";
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { text, language } = req.body;
  const prompt = `Translate the sentence into ${language}.

            Rules:
            1. Output only English letters.
            2. Do not use native script.
            3. Preserve natural pronunciation.
            4. Return only the translated sentence.

            Sentence:
            ${text}
        `;
  const response = await client.responses.create({
    model: "openai/gpt-oss-20b",
    input: prompt,
  });
  return res.status(200).json({ translatedText: response["output_text"] });
}
