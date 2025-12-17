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

const findMajority = <T>(arr: T[]): T => {
    if (!arr || arr.length === 0) return undefined as T;
    
    const counts = new Map<string, number>();
    const stringifiedArr = arr.map(item => JSON.stringify(item));
    
    for (const item of stringifiedArr) {
        counts.set(item, (counts.get(item) || 0) + 1);
    }

    let majorityItemString = stringifiedArr[0];
    let maxCount = 0;
    
    for (const [item, count] of counts.entries()) {
        if (count > maxCount) {
            maxCount = count;
            majorityItemString = item;
        }
    }
    return JSON.parse(majorityItemString);
};


// --- Schemas ---

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

const studentPaperSchema = (questionCount: number) => ({
  type: Type.OBJECT,
  properties: {
    studentName: { type: Type.STRING, description: "Öğrencinin adı ve soyadı." },
    studentNumber: { type: Type.STRING, description: "Öğrencinin numarası." },
    subject: { type: Type.STRING, description: "Sınavın veya dersin adı." },
    answers: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: `Puan Tablosu'ndan satır satır, soldan sağa doğru çıkarılan tam olarak ${questionCount} adet öğrenci cevabı.`
    }
  },
  required: ["studentName", "studentNumber", "subject", "answers"],
});

const standardAnalysisSchema = (questionCount: number) => ({
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
});

// --- Helper Functions ---

const runGeminiRequest = async (
    parts: Part[],
    schema: object,
    model: 'gemini-flash-latest' | 'gemini-2.5-pro' | 'gemini-flash-lite-latest',
    systemInstruction?: string,
    enableThinking?: boolean
) => {
    const MAX_RETRIES = 3;
    const INITIAL_DELAY_MS = 1000;

    const config: any = {
        responseMimeType: "application/json",
        responseSchema: schema,
    };

    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }
    
    if (enableThinking) {
        config.thinkingConfig = { thinkingBudget: 8192 };
    }

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            return await ai.models.generateContent({
                model: model,
                contents: { parts: parts },
                config: config
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

// --- Main Service Functions ---

export const analyzeAnswerKey = async (answerKeyBase64: string, mimeType: string, questionCount: number): Promise<string[]> => {
    console.log(`Cevap anahtarı için ${questionCount} soruluk konsensüs analizi başlatılıyor...`);
    const answerKeyImagePart: Part = { inlineData: { data: answerKeyBase64, mimeType: mimeType } };
    const answerKeyPrompt = `Bu çoktan seçmeli optik test formunda işaretlenmiş veya karalanmış baloncukları analiz et. Her bir soru numarası ve buna karşılık gelen işaretli harf seçeneğini (örn: '1': 'A', '2': 'B') dikkate al. Görüntüden tam olarak ${questionCount} adet cevabı, JSON objesi yerine, sırasıyla basit bir dizi olarak çıkar.`;
    const schema = answerKeyExtractionSchema(questionCount);
    
    const requests = Array(3).fill(0).map(() => runGeminiRequest(
        [{ text: answerKeyPrompt }, answerKeyImagePart], 
        schema,
        'gemini-flash-latest'
    ));

    const results = await Promise.allSettled(requests);
    
    const successfulResponses = results
        .filter(result => result.status === 'fulfilled')
        .map(result => JSON.parse((result as PromiseFulfilledResult<GenerateContentResponse>).value.text.trim()));

    if (successfulResponses.length < 2) {
        throw new Error("Cevap anahtarı yeterli sayıda başarılı analiz edilemedi. Lütfen resim kalitesini kontrol edin.");
    }
    
    const allAnswers: string[][] = successfulResponses.map(res => res.answers).filter(ans => Array.isArray(ans) && ans.length === questionCount);

    if (allAnswers.length === 0) {
        throw new Error(`Cevap anahtarı analizinden beklenen ${questionCount} adet cevap alınamadı.`);
    }

    const consensusKey: string[] = [];
    for (let i = 0; i < questionCount; i++) {
        const answersForQuestionI = allAnswers.map(answerSet => answerSet[i] || '');
        consensusKey.push(findMajority(answersForQuestionI));
    }
    
    console.log("Konsensüs cevap anahtarı oluşturuldu:", consensusKey);
    return consensusKey.map(String);
};


export const analyzeStudentPaper = async (
    studentPaperBase64: string, 
    mimeType: string, 
    questionCount: number, 
    consensusKey: string[]
): Promise<ExamData> => {
    console.log("Öğrenci kağıdı için konsensüs analizi başlatılıyor...");
    const studentPaperImagePart: Part = { inlineData: { data: studentPaperBase64, mimeType: mimeType } };
    const prompt = `Bu çoktan seçmeli optik test formunda işaretlenmiş veya karalanmış baloncukları analiz et. Görüntüdeki sınav kağıdını dikkatle incele. Görevin, aşağıdaki bilgileri en yüksek doğrulukla çıkarmaktır: 1. **Öğrenci Adı Soyadı**: 'Öğrenci Adı' bölümünde yazan tam isim. 2. **Öğrenci Numarası**: 'Öğrenci Numarası' bölümünde yazan numara. 3. **Ders Adı**: 'Dersin Adı' bölümünde yazan ders. 4. **Öğrenci Cevapları**: Puan tablosundan, her bir soru numarasına karşılık gelen işaretli harf seçeneğini (örn: '1': 'A', '2': 'B') dikkate alarak tam olarak ${questionCount} adet öğrenci cevabını çıkar. İşaretlemeleri analiz ederken, her bir soru için en üstteki A,B,C,D,E harflerinin sütun hizasını referans al. Her yeni soru satırında bu hizalamayı koruyarak doğru seçeneği belirle. Cevapları JSON objesi yerine, sırasıyla basit bir dizi olarak çıkar. Cevapları soldan sağa, yukarıdan aşağıya doğru sırayla al. Eğer bir bilgi okunamıyorsa, kesinlikle boş bir string ("") olarak bırak. Tahminde bulunma.`;
    const schema = studentPaperSchema(questionCount);
    const systemInstruction = "Sen, bir sınav kağıdı değerlendirme uzmanısın ve görevin verilen görselden kritik bilgileri hata yapmadan ayıklamaktır.";

    const requests = Array(3).fill(0).map(() => runGeminiRequest(
        [{ text: prompt }, studentPaperImagePart],
        schema,
        'gemini-flash-latest',
        systemInstruction,
        true
    ));

    const results = await Promise.allSettled(requests);

    const successfulResponses = results
        .filter(result => result.status === 'fulfilled')
        .map(result => JSON.parse((result as PromiseFulfilledResult<GenerateContentResponse>).value.text.trim()));

    if (successfulResponses.length < 2) {
        throw new Error("Öğrenci kağıdı yeterli sayıda başarılı analiz edilemedi. Lütfen resim kalitesini kontrol edin.");
    }
    
    const unreadablePlaceholders = ["OKUNAMADI", "N/A", "YOK", "BOŞ", "BELİRTİLMEMİŞ", "NULL"];
    const cleanValue = (value: unknown): string => {
        const strValue = String(value ?? '').trim();
        if (strValue === '' || unreadablePlaceholders.some(p => strValue.toUpperCase().includes(p))) {
            return '';
        }
        return strValue;
    };

    const consensusStudentName = findMajority(successfulResponses.map(res => cleanValue(res.studentName)));
    const consensusStudentNumber = findMajority(successfulResponses.map(res => cleanValue(res.studentNumber)));
    const consensusSubject = findMajority(successfulResponses.map(res => cleanValue(res.subject)));
    
    const allAnswers: string[][] = successfulResponses
        .map(res => res.answers)
        .filter(ans => Array.isArray(ans) && ans.length === questionCount);

    if (allAnswers.length === 0) {
        throw new Error(`Öğrenci kağıdı cevapları analiz edilemedi. Beklenen ${questionCount} cevap alınamadı.`);
    }

    const consensusStudentAnswers: string[] = [];
    for (let i = 0; i < questionCount; i++) {
        const answersForQuestionI = allAnswers.map(answerSet => answerSet[i] || '');
        consensusStudentAnswers.push(findMajority(answersForQuestionI));
    }
    
    const pointsPerQuestion = Number((100 / questionCount).toFixed(2));
    const calculatedScores: number[] = [];
    for (let i = 0; i < questionCount; i++) {
        const studentAnswer = consensusStudentAnswers[i] ? String(consensusStudentAnswers[i]).trim().toUpperCase() : '';
        const correctAnswer = consensusKey[i] ? String(consensusKey[i]).trim().toUpperCase() : '';
        if (studentAnswer && correctAnswer && studentAnswer === correctAnswer) {
            calculatedScores.push(pointsPerQuestion);
        } else {
            calculatedScores.push(0);
        }
    }

    return {
        studentName: consensusStudentName,
        studentNumber: consensusStudentNumber,
        subject: consensusSubject,
        scores: calculatedScores,
        answers: consensusStudentAnswers.map(String)
    };
};

export const extractStudentData = async (
    base64Image: string, 
    mimeType: string, 
    questionCount: number
): Promise<ExamData> => {
    const imagePart: Part = { inlineData: { data: base64Image, mimeType: mimeType } };
    const promptText = `Görüntüdeki sınav kağıdını dikkatle incele. Görevin, aşağıdaki bilgileri en yüksek doğrulukla çıkarmaktır: 1. **Öğrenci Adı Soyadı**: 'Öğrenci Adı' bölümünde yazan tam isim. 2. **Öğrenci Numarası**: 'Öğrenci Numarası' bölümünde yazan numara. 3. **Ders Adı**: 'Dersin Adı' bölümünde yazan ders. 4. **Puanlar**: Puan tablosundan tam olarak ${questionCount} adet sayısal puanı çıkar. Puanları soldan sağa, yukarıdan aşağıya doğru sırayla al. Eğer bir bilgi okunamıyorsa, kesinlikle boş bir string ("") olarak bırak. Tahminde bulunma.`;
    const schema = standardAnalysisSchema(questionCount);
    const systemInstruction = "Sen, bir sınav kağıdı değerlendirme uzmanısın ve görevin verilen görselden kritik bilgileri hata yapmadan ayıklamaktır.";
    
    const requests = Array(3).fill(0).map(() => runGeminiRequest(
        [{ text: promptText }, imagePart], 
        schema,
        'gemini-flash-latest',
        systemInstruction,
        true
    ));

    const results = await Promise.allSettled(requests);
    
    const successfulResponses = results
        .filter(result => result.status === 'fulfilled')
        .map(result => JSON.parse((result as PromiseFulfilledResult<GenerateContentResponse>).value.text.trim()));

    if (successfulResponses.length < 2) {
        throw new Error("Öğrenci kağıdı yeterli sayıda başarılı analiz edilemedi. Lütfen resim kalitesini kontrol edin.");
    }

    const unreadablePlaceholders = ["OKUNAMADI", "N/A", "YOK", "BOŞ", "BELİRTİLMEMİŞ", "NULL"];
    const cleanValue = (value: unknown): string => {
        const strValue = String(value ?? '').trim();
        if (strValue === '' || unreadablePlaceholders.some(p => strValue.toUpperCase().includes(p))) {
            return '';
        }
        return strValue;
    };
    
    const consensusStudentName = findMajority(successfulResponses.map(res => cleanValue(res.studentName)));
    const consensusStudentNumber = findMajority(successfulResponses.map(res => cleanValue(res.studentNumber)));
    const consensusSubject = findMajority(successfulResponses.map(res => cleanValue(res.subject)));
    
    const allScores: (number | null)[][] = successfulResponses
        .map(res => res.scores)
        .filter(scores => Array.isArray(scores) && scores.length === questionCount);

    if (allScores.length === 0) {
        throw new Error(`Öğrenci kağıdı puanları analiz edilemedi. Beklenen ${questionCount} puan alınamadı.`);
    }

    const consensusScores: number[] = [];
    for (let i = 0; i < questionCount; i++) {
        const scoresForQuestionI = allScores.map(scoreSet => scoreSet[i] ?? 0);
        consensusScores.push(findMajority(scoresForQuestionI));
    }

    return {
        studentName: consensusStudentName,
        studentNumber: consensusStudentNumber,
        subject: consensusSubject,
        scores: consensusScores,
    };
};