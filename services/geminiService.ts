import { GoogleGenAI, Type, Part, GenerateContentResponse } from "@google/genai";
import type { ExamData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const isRateLimitError = (error: unknown): boolean => {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('429') || message.includes('resource_exhausted') || message.includes('quota');
    }
    return false;
};


const handleGeminiError = (error: unknown): Error => {
    console.error("Error analyzing image with Gemini:", error);
    if (isRateLimitError(error)) {
        return new Error("API kullanım kotası aşıldı. Lütfen bir dakika bekleyip tekrar deneyin. Çok sayıda kağıt analiz ediyorsanız bu beklenen bir durumdur.");
    }
     if (error instanceof Error && error.message.includes('API key not valid')) {
        return new Error("Yapılandırılmış API anahtarı geçersiz. Lütfen yapılandırmanızı kontrol edin.");
    }
    return new Error("Görüntü analiz edilemedi. İçerik okunamıyor olabilir veya hizmet kullanılamıyor olabilir.");
};


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

const runGeminiRequest = async (parts: Part[], schema: object, model: 'gemini-flash-latest' | 'gemini-flash-lite-latest' | 'gemini-2.5-pro') => {
    const MAX_RETRIES = 3;
    const INITIAL_DELAY_MS = 1000;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            return await ai.models.generateContent({
                model: model,
                contents: { parts: parts },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                }
            });
        } catch (error) {
            if (isRateLimitError(error) && i < MAX_RETRIES - 1) {
                const delayMs = INITIAL_DELAY_MS * Math.pow(2, i) + Math.random() * 1000;
                console.warn(`Rate limit hatası alındı. ${Math.round(delayMs / 1000)} saniye sonra yeniden denenecek... (${i + 1}/${MAX_RETRIES})`);
                await delay(delayMs);
            } else {
                throw handleGeminiError(error);
            }
        }
    }
    // This part should not be reachable if the loop logic is correct, but TypeScript needs it.
    throw new Error("Tüm yeniden denemelere rağmen API isteği başarısız oldu.");
};

const getConsensus = <T>(items: (T | undefined)[], requiredLength: number): T => {
    // For arrays, we check the length. For objects, we just check for existence.
    const validItems = items.filter(item => {
        if (!item) return false;
        if (Array.isArray(item)) {
            return item.length === requiredLength;
        }
        return true; // It's a valid object if it exists
    });

    if (validItems.length === 0) {
        throw new Error("Bir veya daha fazla analiz denemesi başarısız oldu veya beklenenden farklı sayıda sonuç döndürdü.");
    }
    
    const firstValidItem = validItems[0];

    if (Array.isArray(firstValidItem)) {
        const consensusArray: any[] = [];
        for (let i = 0; i < requiredLength; i++) {
            const voteMap: { [key: string]: number } = {};
            for (const item of validItems as any[][]) {
                 const vote = item ? item[i] : undefined;
                 if (vote !== undefined && vote !== null) {
                    const voteStr = String(vote);
                    voteMap[voteStr] = (voteMap[voteStr] || 0) + 1;
                }
            }
            const majorityVote = Object.keys(voteMap).length > 0
                ? Object.keys(voteMap).reduce((a, b) => voteMap[a] > voteMap[b] ? a : b)
                : 'OKUNAMADI';
            consensusArray.push(majorityVote);
        }
        return consensusArray as T;
    } else {
         const voteMap: { [key: string]: number } = {};
         for (const item of validItems as any[]) {
            const vote = JSON.stringify(item);
            if (vote) voteMap[vote] = (voteMap[vote] || 0) + 1;
         }
         const majorityVote = Object.keys(voteMap).length > 0
            ? Object.keys(voteMap).reduce((a, b) => voteMap[a] > voteMap[b] ? a : b)
            : '{}';
         return JSON.parse(majorityVote) as T;
    }
};


// --- Main Service Functions ---

export const analyzeAnswerKey = async (answerKeyBase64: string, mimeType: string, questionCount: number): Promise<string[]> => {
    console.log("Starting robust answer key analysis with Pro model...");
    const answerKeyImagePart: Part = { inlineData: { data: answerKeyBase64, mimeType: mimeType } };
    const answerKeyPrompt = `Cevap anahtarı görüntüsünü analiz et. Tam olarak ${questionCount} adet cevabı çıkar. Cevapları sırayla, soldan sağa ve satır satır çıkar.`;
    
    const analysisPromises = Array(2).fill(null).map(() => 
        runGeminiRequest(
            [{ text: answerKeyPrompt }, answerKeyImagePart], 
            answerKeyExtractionSchema(questionCount),
            'gemini-2.5-pro'
        )
    );
    
    const results = await Promise.all(analysisPromises);
    
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

    // 1. Extract student data (single run)
    const dataPrompt = `Öğrencinin tam adını (Öğrenci Adı), öğrenci numarasını (Öğrenci Numarası) ve ders adını (Dersin Adı) çıkar. Eğer herhangi bir bilgi okunamıyorsa veya mevcut değilse, o alanı boş bırak ("").`;
    const dataResult = await runGeminiRequest(
        [{ text: dataPrompt }, studentPaperImagePart],
        studentDataExtractionSchema,
        'gemini-flash-lite-latest'
    );
    
    let studentData: Partial<ExamData> = {};
    try {
        studentData = JSON.parse(dataResult.text.trim());
    } catch(e) {
        console.error("Failed to parse student data JSON:", dataResult.text);
        throw new Error("Öğrenci verileri analiz edilemedi. Modelden gelen yanıt JSON formatında değil.");
    }
    
    const unreadablePlaceholders = ["OKUNAMADI", "N/A", "YOK", "BOŞ", "BELİRTİLMEMİŞ"];
    Object.keys(studentData).forEach(key => {
        const value = studentData[key as keyof typeof studentData];
        if (typeof value === 'string' && (value.trim() === '' || unreadablePlaceholders.some(p => value.toUpperCase().includes(p)))) {
            (studentData as any)[key] = '';
        }
    });

    // 2. Extract student answers (2 parallel runs for consensus)
    const answersPrompt = `Öğrencinin Puan Tablosu'ndan tam olarak ${questionCount} adet cevabını çıkar. Cevapları sırayla, soldan sağa ve satır satır çıkar.`;
    const answersPromises = Array(2).fill(null).map(() => 
        runGeminiRequest(
            [{ text: answersPrompt }, studentPaperImagePart], 
            studentAnswersSchema(questionCount),
            'gemini-flash-lite-latest'
        )
    );
    const answersResults = await Promise.all(answersPromises);

    const allAnswerSets = answersResults.map(res => {
        try { return JSON.parse(res.text.trim()).answers; } 
        catch { return undefined; }
    });
    const consensusStudentAnswers = getConsensus<string[]>(allAnswerSets, questionCount);
    console.log("Consensus student answers created:", consensusStudentAnswers);

    // 3. Score deterministically in code
    const pointsPerQuestion = Number((100 / questionCount).toFixed(2));
    const calculatedScores: number[] = [];
    for (let i = 0; i < questionCount; i++) {
        if (consensusStudentAnswers[i] && consensusKey[i] && consensusStudentAnswers[i].trim().toUpperCase() === consensusKey[i].trim().toUpperCase()) {
            calculatedScores.push(pointsPerQuestion);
        } else {
            calculatedScores.push(0);
        }
    }

    return {
        studentName: studentData.studentName || '',
        studentNumber: studentData.studentNumber || '',
        subject: studentData.subject || '',
        scores: calculatedScores,
    };
};

export const extractStudentData = async (
    base64Image: string, 
    mimeType: string, 
    questionCount: number
): Promise<ExamData[]> => {
    const imagePart: Part = { inlineData: { data: base64Image, mimeType: mimeType } };
    const promptText = `Sınav kağıdı görüntüsünü analiz et. Öğrencinin tam adını (Öğrenci Adı), öğrenci numarasını (Öğrenci Numarası), ders adını (Dersin Adı) ve Puan Tablosu'ndan tam olarak ${questionCount} adet sayısal notu çıkar. Notları satır satır, soldan sağa çıkar. Eğer herhangi bir metin bilgisi (isim, numara, ders) okunamıyorsa, o alanı boş bırak ("").`;
    
    const response = await runGeminiRequest(
        [{ text: promptText }, imagePart], 
        standardAnalysisSchema(questionCount),
        'gemini-flash-lite-latest'
    );
    
    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);

    if (!Array.isArray(parsedData)) {
        throw new Error("Gemini returned data in an unexpected format.");
    }
    
    const unreadablePlaceholders = ["OKUNAMADI", "N/A", "YOK", "BOŞ", "BELİRTİLMEMİŞ"];
    const cleanedData = parsedData.map(item => {
        const cleanedItem = { ...item };
        Object.keys(cleanedItem).forEach(key => {
            if (key === 'studentName' || key === 'studentNumber' || key === 'subject') {
                 const value = (cleanedItem as any)[key];
                 if (typeof value === 'string' && (value.trim() === '' || unreadablePlaceholders.some(p => value.toUpperCase().includes(p)))) {
                    (cleanedItem as any)[key] = '';
                 }
            }
        });
        return cleanedItem;
    });

    return cleanedData as ExamData[];
};