<template>
  <div class="container mt-5">
    <h1>테스트 페이지</h1>
    <p>현재 시간: {{ currentTime }}</p>
    <button @click="updateTime" class="btn btn-primary">시간 업데이트</button>
    
    <div class="mt-4">
      <h3>게임 상태 테스트</h3>
      <p>현재 플레이어: <strong>{{ currentPlayer }}</strong></p>
      <button @click="switchPlayer" class="btn btn-success">플레이어 변경</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const currentTime = ref('')
const currentPlayer = ref('cho')

const updateTime = () => {
  currentTime.value = new Date().toLocaleString()
}

const switchPlayer = () => {
  currentPlayer.value = currentPlayer.value === 'cho' ? 'han' : 'cho'
}

onMounted(() => {
  updateTime()
  console.log('테스트 페이지 마운트됨')
})
</script>
