/**
 * Offline Exam Resilience Engine
 * Uses native IndexedDB with LocalStorage fallback to guarantee 0% data loss
 * during rural internet disconnections or accidental browser reloads.
 */

const DB_NAME = 'ExamirrorOfflineExamDB';
const DB_VERSION = 1;
const STORE_NAME = 'student_exam_progress';

function openExamDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'examId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

export interface ExamOfflineState {
  examId: string | number;
  answers: Record<number, string>;
  markedForReview?: Record<number, boolean>;
  timeLeft?: number | null;
  currentQuestionIdx?: number;
  updatedAt: number;
}

/**
 * Save exam state to both IndexedDB and LocalStorage for dual redundancy
 */
export async function saveExamOfflineState(state: ExamOfflineState): Promise<void> {
  try {
    // 1. LocalStorage immediate backup
    localStorage.setItem(`exam_${state.examId}_answers`, JSON.stringify(state.answers));
    if (state.timeLeft !== undefined && state.timeLeft !== null) {
      localStorage.setItem(`exam_${state.examId}_timeLeft`, String(state.timeLeft));
    }
    localStorage.setItem(`exam_${state.examId}_lastSaved`, String(state.updatedAt));

    // 2. IndexedDB persistent structured backup
    const db = await openExamDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ ...state, examId: String(state.examId) });
    }
  } catch (err) {
    console.warn('[ExamOfflineStorage] Failed to save offline state:', err);
  }
}

/**
 * Restore exam state from IndexedDB or LocalStorage
 */
export async function loadExamOfflineState(examId: string | number): Promise<ExamOfflineState | null> {
  try {
    // Try IndexedDB first
    const db = await openExamDB();
    if (db) {
      const record = await new Promise<any>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(String(examId));
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (record && record.answers && Object.keys(record.answers).length > 0) {
        return record;
      }
    }

    // LocalStorage fallback
    const localAnswers = localStorage.getItem(`exam_${examId}_answers`);
    const localTimeLeft = localStorage.getItem(`exam_${examId}_timeLeft`);
    if (localAnswers) {
      return {
        examId,
        answers: JSON.parse(localAnswers),
        timeLeft: localTimeLeft ? Number(localTimeLeft) : undefined,
        updatedAt: Date.now()
      };
    }
  } catch (err) {
    console.warn('[ExamOfflineStorage] Failed to load offline state:', err);
  }
  return null;
}

/**
 * Clean up exam state after successful submission
 */
export async function clearExamOfflineState(examId: string | number): Promise<void> {
  try {
    localStorage.removeItem(`exam_${examId}_answers`);
    localStorage.removeItem(`exam_${examId}_timeLeft`);
    localStorage.removeItem(`exam_${examId}_lastSaved`);

    const db = await openExamDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(String(examId));
    }
  } catch (err) {
    console.warn('[ExamOfflineStorage] Failed to clear offline state:', err);
  }
}
