import React from 'react';
import styles from './ForkCreationModal.module.css';

interface ForkCreationModalProps {
  isOpen: boolean;
  message: string;
  error?: string;
  onClose?: () => void;
}

/**
 * Fork作成時のモーダルコンポーネント
 */
export default function ForkCreationModal({
  isOpen,
  message,
  error,
  onClose
}: ForkCreationModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          {!error ? (
            <>
              <div className={styles.spinner}>🔄</div>
              <h3 className={styles.title}>リポジトリを準備しています</h3>
              <p className={styles.message}>{message}</p>
              <div className={styles.progressSteps}>
                <div className={`${styles.step} ${message.includes('確認') ? styles.active : ''}`}>
                  <span className={styles.stepIcon}>🔍</span>
                  <span className={styles.stepText}>既存のForkを確認</span>
                </div>
                <div className={`${styles.step} ${message.includes('作成') ? styles.active : ''}`}>
                  <span className={styles.stepIcon}>🍴</span>
                  <span className={styles.stepText}>Forkを作成</span>
                </div>
                <div className={`${styles.step} ${message.includes('準備') ? styles.active : ''}`}>
                  <span className={styles.stepIcon}>✅</span>
                  <span className={styles.stepText}>準備完了</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.errorIcon}>⚠️</div>
              <h3 className={styles.errorTitle}>エラーが発生しました</h3>
              <p className={styles.errorMessage}>{error}</p>
              {onClose && (
                <button className={styles.closeButton} onClick={onClose}>
                  閉じる
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}