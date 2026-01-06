import { GoogleGenAI } from "@google/genai";
import { Sale, Customer, Product } from "../types";

// API 키를 localStorage에서만 가져옴
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

// 데이터베이스 데이터를 기반으로 AI 대화
export const chatWithAI = async (
  userMessage: string,
  sales: Sale[],
  customers: Customer[],
  products: Product[]
) => {
  try {
    const ai = getAI();

    // 데이터를 요약해서 컨텍스트 생성
    const context = {
      총판매건수: sales.length,
      총매출: sales.reduce((sum, s) => sum + s.total_amount, 0),
      미수금총액: sales.reduce((sum, s) => sum + (s.payment_status === '미결제' ? s.unpaid_balance : 0), 0),
      거래처목록: customers.map(c => c.name),
      품목목록: products.map(p => p.name),
      최근판매: sales.slice(-10).map(s => ({
        날짜: s.date,
        거래처: s.customer_name,
        품목: s.product_name,
        금액: s.total_amount,
        결제상태: s.payment_status
      }))
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `당신은 정미소(쌀가게) 경영 데이터를 분석하는 AI 비서입니다.

다음은 현재 데이터베이스의 정보입니다:
${JSON.stringify(context, null, 2)}

사용자 질문: "${userMessage}"

위 데이터를 바탕으로 사용자의 질문에 정확하고 친절하게 답변해주세요.
- 구체적인 숫자와 거래처명을 언급하세요
- 금액은 원 단위로 표시하세요
- 만약 데이터가 부족하면 "현재 데이터에서는 확인할 수 없습니다"라고 알려주세요`,
      config: {
        systemInstruction: "당신은 30년 경력의 베테랑 정미소 전문 경영 컨설턴트입니다. 항상 존댓말을 사용하고 구체적인 데이터를 기반으로 답변합니다.",
        temperature: 0.7,
      }
    });

    return response.text || "답변을 생성할 수 없습니다.";
  } catch (error: any) {
    console.error("AI 채팅 실패", error);
    if (error.message?.includes('API 키')) {
      return "⚠️ API 키가 설정되지 않았습니다. 우측 상단의 'API 키 설정' 버튼을 클릭하여 Gemini API 키를 입력해주세요.";
    }
    return "AI 응답을 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.";
  }
};
