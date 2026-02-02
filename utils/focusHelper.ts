/**
 * Electron 환경에서 모달 닫힌 후 포커스 손실 문제를 해결하는 헬퍼 함수
 *
 * 문제: Electron 웹뷰에서 모달이 닫히면 웹뷰 자체가 포커스를 잃어버려서
 *       입력 필드를 클릭해도 텍스트가 입력되지 않음
 *
 * 해결: 모달이 닫힐 때 window.focus()를 호출하여 웹뷰에 포커스를 다시 줌
 */

/**
 * 모달이 닫힐 때 Electron 웹뷰에 포커스 복원
 */
export const restoreWebViewFocus = () => {
  // Electron 웹뷰에 포커스를 다시 줌
  setTimeout(() => {
    window.focus();
    document.body.focus();

    // 추가적으로 body를 클릭하여 확실하게 활성화
    document.body.click();
  }, 100);
};

/**
 * 모달 닫기 + 웹뷰 포커스 복원을 한 번에 처리
 * 모든 모달의 onClose 핸들러를 이 함수로 감싸서 사용
 */
export const closeModalWithFocusRestore = (onClose: () => void) => {
  // 먼저 모달을 닫음
  onClose();

  // 모달이 DOM에서 제거된 후 웹뷰 포커스 복원
  restoreWebViewFocus();
};
