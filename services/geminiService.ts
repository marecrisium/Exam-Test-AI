import { GoogleGenAI, Type, Part, GenerateContentResponse } from "@google/genai";
import type { ExamData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Schemas ---

const studentDataExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    studentName: { type: Type.STRING, description: "Öğrencinin adı ve soyadı." },
    studentNumber: { type: Type.STRING, description: "Öğrencinin numarası." },
    subject: { type: Type.STRING, description: "Sınavın veya dersin adı." },
  },
  required: ["studentName", "studentNumber", "subject"],
};

const studentAnswersSchema = (questionCount: number) => ({
  type: Type.OBJECT,
  properties: {
      answers: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: `Puan Tablosu'ndan satır satır, soldan sağa doğru çıkarılan tam olarak ${questionCount} adet öğrenci cevabı.`
      }
  },
  required: ["answers"]
});

const answerKeyExtractionSchema = (questionCount: number) => ({
  type: Type.OBJECT,
  properties: {
      answers: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: `Görüntüden çıkarılan tam olarak ${questionCount} adet cevap. Cevaplar tipik olarak tek harftir (A, B, C, D, E).`
      }
  },
  required: ["answers"]
});

const standardAnalysisSchema = (questionCount: number) => ({
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        studentName: { type: Type.STRING },
        studentNumber: { type: Type.STRING },
        subject: { type: Type.STRING },
        scores: {
          type: Type.ARRAY,
          items: { type: Type.NUMBER },
          description: `Puan Tablosu'ndan çıkarılan tam olarak ${questionCount} adet sayısal not.`,
        },
      },
      required: ["studentName", "studentNumber", "subject", "scores"],
    },
});

// --- Helper Functions ---

const runGeminiRequest = (parts: Part[], schema: object) => {
    return ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        }
    });
};

const getConsensus = <T>(items: (T | undefined)[], requiredLength: number): T => {
    if (items.some(item => !item || (Array.isArray(item) && item.length !== requiredLength))) {
        throw new Error("Bir veya daha fazla analiz denemesi başarısız oldu veya beklenenden farklı sayıda sonuç döndürdü.");
    }

    if (Array.isArray(items[0])) {
        const consensusArray: any[] = [];
        for (let i = 0; i < requiredLength; i++) {
            const voteMap: { [key: string]: number } = {};
            for (const item of items as any[][]) {
                const vote = item[i];
                if (vote) voteMap[vote] = (voteMap[vote] || 0) + 1;
            }
            const majorityVote = Object.keys(voteMap).reduce((a, b) => voteMap[a] > voteMap[b] ? a : b, '');
            consensusArray.push(majorityVote || 'OKUNAMADI');
        }
        return consensusArray as T;
    } else {
         const voteMap: { [key: string]: number } = {};
         for (const item of items as any[]) {
            const vote = JSON.stringify(item);
            if (vote) voteMap[vote] = (voteMap[vote] || 0) + 1;
         }
         const majorityVote = Object.keys(voteMap).reduce((a, b) => voteMap[a] > voteMap[b] ? a : b, '{}');
         return JSON.parse(majorityVote) as T;
    }
};


// --- Main Service Functions ---

export const analyzeAnswerKey = async (answerKeyBase64: string, questionCount: number): Promise<string[]> => {
    console.log("Starting robust answer key analysis...");
    const answerKeyImagePart: Part = { inlineData: { data: answerKeyBase64, mimeType: 'image/jpeg' } };
    const answerKeyPrompt = `Cevap anahtarı görüntüsünü analiz et. Tam olarak ${questionCount} adet cevabı çıkar. Cevapları sırayla, soldan sağa ve satır satır çıkar.`;
    
    const results: GenerateContentResponse[] = [];
    const NUM_RUNS = 3; // Reduced from 10 parallel to 3 sequential runs to avoid rate limiting.
    for (let i = 0; i < NUM_RUNS; i++) {
        const result = await runGeminiRequest([{ text: answerKeyPrompt }, answerKeyImagePart], answerKeyExtractionSchema(questionCount));
        results.push(result);
    }
    
    const allAnswerSets = results.map(res => {
        try { return JSON.parse(res.text.trim()).answers; } 
        catch { return undefined; }
    });

    const consensusKey = getConsensus<string[]>(allAnswerSets, questionCount);
    console.log("Consensus answer key created:", consensusKey);
    return consensusKey;
};


export const analyzeStudentPaper = async (
    studentPaperBase64: string, 
    mimeType: string, 
    questionCount: number, 
    consensusKey: string[]
): Promise<ExamData> => {
    console.log("Starting robust student paper analysis...");
    const studentPaperImagePart: Part = { inlineData: { data: studentPaperBase64, mimeType: mimeType } };
    const NUM_RUNS = 3;

    // 1. Extract student data (3 sequential runs for consensus)
    const dataPrompt = `Öğrencinin tam adını (Öğrenci Adı), öğrenci numarasını (Öğrenci Numarası) ve ders adını (Dersin Adı) çıkar.`;
    const dataResults: GenerateContentResponse[] = [];
    for (let i = 0; i < NUM_RUNS; i++) {
        const result = await runGeminiRequest([{ text: dataPrompt }, studentPaperImagePart], studentDataExtractionSchema);
        dataResults.push(result);
    }
    const allDataSets = dataResults.map(res => {
        try { return JSON.parse(res.text.trim()); } 
        catch { return undefined; }
    });
    const consensusStudentData = getConsensus<{ studentName: string, studentNumber: string, subject: string }>(allDataSets, 3);

    // 2. Extract student answers (3 sequential runs for consensus)
    const answersPrompt = `Öğrencinin Puan Tablosu'ndan tam olarak ${questionCount} adet cevabını çıkar. Cevapları sırayla, soldan sağa ve satır satır çıkar.`;
    const answersResults: GenerateContentResponse[] = [];
    for (let i = 0; i < NUM_RUNS; i++) {
        const result = await runGeminiRequest([{ text: answersPrompt }, studentPaperImagePart], studentAnswersSchema(questionCount));
        answersResults.push(result);
    }
    const allAnswerSets = answersResults.map(res => {
        try { return JSON.parse(res.text.trim()).answers; } 
        catch { return undefined; }
    });
    const consensusStudentAnswers = getConsensus<string[]>(allAnswerSets, questionCount);
    console.log("Consensus student answers created:", consensusStudentAnswers);

    // 3. Score deterministically in code
    const pointsPerQuestion = 100 / questionCount;
    const calculatedScores: number[] = [];
    for (let i = 0; i < questionCount; i++) {
        if (consensusStudentAnswers[i] && consensusKey[i] && consensusStudentAnswers[i].trim().toUpperCase() === consensusKey[i].trim().toUpperCase()) {
            calculatedScores.push(pointsPerQuestion);
        } else {
            calculatedScores.push(0);
        }
    }

    return {
        ...consensusStudentData,
        scores: calculatedScores,
    };
};

export const extractStudentData = async (
    base64Image: string, 
    mimeType: string, 
    questionCount: number
): Promise<ExamData[]> => {
    try {
        const imagePart: Part = { inlineData: { data: base64Image, mimeType: mimeType } };
        const promptText = `Sınav kağıdı görüntüsünü analiz et. Öğrencinin tam adını (Öğrenci Adı), öğrenci numarasını (Öğrenci Numarası), ders adını (Dersin Adı) ve Puan Tablosu'ndan tam olarak ${questionCount} adet sayısal notu çıkar. Notları satır satır, soldan sağa çıkar.`;
        
        const response = await runGeminiRequest([{ text: promptText }, imagePart], standardAnalysisSchema(questionCount));
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);

        if (!Array.isArray(parsedData)) {
            throw new Error("Gemini returned data in an unexpected format.");
        }
        return parsedData as ExamData[];

    } catch (error) {
        console.error("Error analyzing image with Gemini:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error("The configured API key is invalid. Please check your configuration.");
        }
        throw new Error("Failed to analyze the image. The content may not be readable or the service may be unavailable.");
    }
};