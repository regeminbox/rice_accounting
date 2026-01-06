
import { GoogleGenAI, Type } from "@google/genai";

// API 키를 localStorage에서만 가져옴 (빌드에 포함되지 않음)
const getApiKey = () => {
  const userApiKey = localStorage.getItem('gemini_api_key');
  return userApiKey || '';
};

// GoogleGenAI 인스턴스를 동적으로 생성하는 함수
const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다. 설정에서 Gemini API 키를 입력해주세요.');
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeSalesData = async (text: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `다음은 쌀가게의 비정형 거래 내역 텍스트입니다. 이를 분석하여 구조화된 JSON 형태로 추출해주세요: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING },
            productName: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unitPrice: { type: Type.NUMBER },
            status: { type: Type.STRING, description: "결제완료, 미결제, 배송중 중 하나" }
          },
          required: ["customerName", "productName", "quantity"]
        }
      }
    });
    // Fix: Access .text property directly
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return null;
  }
};

export const getAIInsights = async (inventory: any, sales: any) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `다음 재고 데이터(${JSON.stringify(inventory)})와 최근 판매 내역(${JSON.stringify(sales)})을 바탕으로 사장님께 드릴 경영 조언 3가지를 짧게 한국어로 작성해주세요.`,
      config: {
        systemInstruction: "당신은 30년 경력의 베테랑 쌀가게 전문 컨설턴트입니다."
      }
    });
    // Fix: Access .text property directly
    return response.text;
  } catch (error) {
    return "AI 분석을 불러오는 데 실패했습니다.";
  }
};

// 영수증 이미지 분석 (OCR)
export const analyzeReceiptImage = async (imageFile: File) => {
  try {
    const ai = getAI();
    // 이미지를 Base64로 변환
    const base64Image = await fileToBase64(imageFile);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `이 영수증 이미지를 분석하여 거래 정보를 추출해주세요.
          쌀가게 판매 내역이므로 다음 정보를 찾아주세요:
          1. 거래처명 또는 고객명
          2. 품종명 (고시히카리, 추청, 삼광쌀 등)
          3. 수량 (포 단위)
          4. 단가 또는 총 금액

          정보가 명확하지 않으면 합리적으로 추정해주세요.`
        },
        {
          inlineData: {
            mimeType: imageFile.type,
            data: base64Image.split(',')[1] // Remove data:image/...;base64, prefix
          }
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING },
            productName: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unitPrice: { type: Type.NUMBER },
            totalAmount: { type: Type.NUMBER },
            status: { type: Type.STRING, description: "결제완료, 미결제 중 하나" }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("영수증 이미지 분석 실패", error);
    return null;
  }
};

// File을 Base64로 변환하는 헬퍼 함수
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};