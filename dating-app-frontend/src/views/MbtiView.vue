<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { mbtiApi } from '@/api'

const router = useRouter()

interface Question {
  id: number
  question: string
  options: string[]
}

const questions = ref<Question[]>([])
const currentQuestionIndex = ref(0)
const answers = ref<{ questionId: number; answer: number }[]>([])
const loading = ref(true)
const submitting = ref(false)
const completed = ref(false)
const result = ref<string>('')

onMounted(async () => {
  try {
    const response = await mbtiApi.getQuestions()
    questions.value = response.data
  } catch (error) {
    console.error('Failed to load questions:', error)
  } finally {
    loading.value = false
  }
})

const currentQuestion = ref(() => questions.value[currentQuestionIndex.value])

function handleOptionClick(optionIndex: number) {
  answers.value.push({
    questionId: questions.value[currentQuestionIndex.value].id,
    answer: optionIndex,
  })

  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
  } else {
    submitAnswers()
  }
}

async function submitAnswers() {
  submitting.value = true

  try {
    const response = await mbtiApi.submitAnswers(answers.value)
    result.value = response.data.mbtiType
    completed.value = true

    // 延迟跳转到推荐页面
    setTimeout(() => {
      router.push('/recommendations')
    }, 3000)
  } catch (error) {
    console.error('Failed to submit answers:', error)
  } finally {
    submitting.value = false
  }
}

const progress = ref(() => ((currentQuestionIndex.value + 1) / questions.value.length) * 100)
</script>

<template>
  <div class="mbti-page">
    <div class="mbti-card">
      <div v-if="!loading && !completed" class="quiz-container">
        <div class="progress-header">
          <div class="progress-info">
            <span class="question-counter">{{ currentQuestionIndex + 1 }} / {{ questions.length }}</span>
            <span class="percentage">{{ Math.round(progress) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
        </div>

        <div class="question-container">
          <h2 class="question-text">{{ questions[currentQuestionIndex].question }}</h2>

          <div class="options-grid">
            <button
              v-for="(option, index) in questions[currentQuestionIndex].options"
              :key="index"
              @click="handleOptionClick(index)"
              class="option-btn"
              :disabled="submitting"
            >
              <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
              <span class="option-text">{{ option }}</span>
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="completed" class="result-container">
        <div class="result-icon">🎉</div>
        <h2 class="result-title">测试完成！</h2>
        <p class="result-text">你的 MBTI 人格类型是：</p>
        <div class="mbti-result">{{ result }}</div>
        <p class="redirect-text">正在跳转到推荐页面...</p>
      </div>

      <div v-else class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mbti-page {
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

.mbti-card {
  width: 100%;
  max-width: 600px;
  background: var(--surface);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-xl);
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.progress-header {
  margin-bottom: var(--spacing-xl);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.question-counter,
.percentage {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.progress-bar {
  height: 8px;
  background: var(--background);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-gradient);
  border-radius: 4px;
  transition: width var(--transition-base);
}

.question-container {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.question-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.5;
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.option-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--surface);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.option-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  background: rgba(255, 107, 107, 0.05);
  transform: translateX(4px);
}

.option-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.option-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--background);
  border-radius: 50%;
  font-weight: 600;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.option-btn:hover .option-letter {
  background: var(--primary-color);
  color: white;
}

.option-text {
  color: var(--text-primary);
  line-height: 1.5;
}

.result-container {
  text-align: center;
  padding: var(--spacing-xl) 0;
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.result-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
  animation: bounce 0.6s ease-out;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.result-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.result-text {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.mbti-result {
  display: inline-block;
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--primary-gradient);
  color: white;
  border-radius: var(--border-radius-md);
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-md);
}

.redirect-text {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.loading-container {
  text-align: center;
  padding: var(--spacing-xl) 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .mbti-card {
    padding: var(--spacing-lg);
  }

  .question-text {
    font-size: 1.1rem;
  }

  .option-btn {
    padding: var(--spacing-sm) var(--spacing-md);
  }
}
</style>
