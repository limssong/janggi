<template>
  <div class="container mt-4">
    <h1 class="text-center mb-4">장기 게임</h1>
    
    <!-- 장군 메시지 -->
    <div v-if="showCheck" class="check-message text-center mb-3">
      <div class="alert alert-danger fs-1 fw-bold animate__animated animate__bounceIn">
        {{ checkMessage }}
      </div>
    </div>
    
    <div class="row">
      <div class="col-md-8">
        <div class="game-board">
          <canvas 
            ref="boardCanvas" 
            class="board-canvas"
            @click="handleCanvasClick"
            width="450"
            height="500"
          ></canvas>
        </div>
      </div>
      
      <div class="col-md-4">
        <div class="game-info">
          <h4>게임 정보</h4>
          <p class="mb-2">현재 플레이어: {{ currentPlayerName }}</p>
          <p class="mb-2">게임 히스토리: {{ moveHistory.length }} 수</p>
          
          <div class="controls mt-3">
            <button @click="undoMove" class="btn btn-warning" :disabled="moveHistory.length === 0">
              한수 무르기
            </button>
            <button @click="resetGame" class="btn btn-danger ms-2">
              게임 재시작
            </button>
          </div>
        </div>
        
        <div class="rules mt-4">
          <h5>게임 규칙</h5>
          <ul class="small">
            <li><strong>王(王)</strong>: 궁성 안에서 상하좌우 한 칸씩</li>
            <li><strong>士(士)</strong>: 궁성 안에서 대각선 + 직선으로 한 칸씩</li>
            <li><strong>象(象)</strong>: 직선 1칸 → 대각선 2칸</li>
            <li><strong>馬(馬)</strong>: 직선 1칸 → 대각선 1칸</li>
            <li><strong>車(車)</strong>: 상하좌우 직선 + 궁성 안에서 대각선</li>
            <li><strong>包(包)</strong>: 말을 뛰어넘어야만 이동</li>
            <li><strong>卒(卒)</strong>: 직선으로만 이동 (대각선 불가)</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

// 게임 상태
const board = ref(Array(10).fill(null).map(() => Array(9).fill(null)))
const selectedPiece = ref(null)
const currentPlayer = ref('cho') // 'cho' 또는 'han'
const moveHistory = ref([])
const gameOver = ref(false)
const checkMessage = ref('') // 장군 메시지
const showCheck = ref(false) // 장군 표시 여부

// Canvas 관련
const boardCanvas = ref(null)
const canvasWidth = 475
const canvasHeight = 525
const cellSize = 50
const boardOffset = { x: 25, y: 25 }

// 계산된 속성
const currentPlayerName = computed(() => {
  return currentPlayer.value === 'cho' ? '초나라 (파란색)' : '한나라 (빨간색)'
})

// 말 배치 함수
const placePiece = (row, col, player, type) => {
  board.value[row][col] = { player, type }
}

// 게임 초기화
const initGame = () => {
  // 보드 초기화
  board.value = Array(10).fill(null).map(() => Array(9).fill(null))
  
  // 초나라 말 배치 (파란색)
  placePiece(1, 4, 'cho', '王') // 초나라 왕 - 궁성 앞으로 한 칸
  placePiece(0, 0, 'cho', '車')
  placePiece(0, 1, 'cho', '馬')
  placePiece(0, 2, 'cho', '象')
  placePiece(0, 3, 'cho', '士')
  placePiece(0, 5, 'cho', '士')
  placePiece(0, 6, 'cho', '象')
  placePiece(0, 7, 'cho', '馬')
  placePiece(0, 8, 'cho', '車')
  placePiece(2, 1, 'cho', '包')
  placePiece(2, 7, 'cho', '包')
  placePiece(3, 0, 'cho', '卒')
  placePiece(3, 2, 'cho', '卒')
  placePiece(3, 4, 'cho', '卒')
  placePiece(3, 6, 'cho', '卒')
  placePiece(3, 8, 'cho', '卒')
  
  // 한나라 말 배치 (빨간색)
  placePiece(8, 4, 'han', '王') // 한나라 왕 - 궁성 앞으로 한 칸
  placePiece(9, 0, 'han', '車')
  placePiece(9, 1, 'han', '馬')
  placePiece(9, 2, 'han', '象')
  placePiece(9, 3, 'han', '士')
  placePiece(9, 5, 'han', '士')
  placePiece(9, 6, 'han', '象')
  placePiece(9, 7, 'han', '馬')
  placePiece(9, 8, 'han', '車')
  placePiece(7, 1, 'han', '包')
  placePiece(7, 7, 'han', '包')
  placePiece(6, 0, 'han', '卒')
  placePiece(6, 2, 'han', '卒')
  placePiece(6, 4, 'han', '卒')
  placePiece(6, 6, 'han', '卒')
  placePiece(6, 8, 'han', '卒')
  
  selectedPiece.value = null
  currentPlayer.value = 'cho'
  moveHistory.value = []
  gameOver.value = false
  checkMessage.value = ''
  showCheck.value = false
}

// Canvas 클릭 이벤트 처리
const handleCanvasClick = (event) => {
  if (gameOver.value) return
  
  const rect = boardCanvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const col = Math.round((x - boardOffset.x) / cellSize)
  const row = Math.round((y - boardOffset.y) / cellSize)
  
  if (col < 0 || col >= 9 || row < 0 || row >= 10) {
    return
  }
  
  const piece = board.value[row][col]
  
  if (selectedPiece.value) {
    // 말 이동 시도
    if (isValidMove(selectedPiece.value.row, selectedPiece.value.col, row, col)) {
      makeMove(row, col)
    } else if (piece && piece.player === currentPlayer.value) {
      // 다른 말 선택
      selectedPiece.value = { row, col, ...piece }
    } else {
      selectedPiece.value = null
    }
  } else if (piece && piece.player === currentPlayer.value) {
    // 말 선택
    selectedPiece.value = { row, col, ...piece }
  }
  
  drawBoard()
}

// 말 이동 유효성 검사 (정확한 장기 규칙)
const isValidMove = (fromRow, fromCol, toRow, toCol) => {
  const piece = board.value[fromRow][fromCol]
  if (!piece) return false
  
  const targetPiece = board.value[toRow][toCol]
  if (targetPiece && targetPiece.player === piece.player) return false
  
  switch (piece.type) {
    case '王':
      return isValidKingMove(fromRow, fromCol, toRow, toCol)
    case '士':
      return isValidAdvisorMove(fromRow, fromCol, toRow, toCol)
    case '象':
      return isValidElephantMove(fromRow, fromCol, toRow, toCol)
    case '馬':
      return isValidHorseMove(fromRow, fromCol, toRow, toCol)
    case '車':
      return isValidChariotMove(fromRow, fromCol, toRow, toCol)
    case '包':
      return isValidCannonMove(fromRow, fromCol, toRow, toCol)
    case '卒':
      return isValidPawnMove(fromRow, fromCol, toRow, toCol)
    default:
      return false
  }
}

// 장(王) 이동 규칙
const isValidKingMove = (fromRow, fromCol, toRow, toCol) => {
  const rowDiff = Math.abs(toRow - fromRow)
  const colDiff = Math.abs(toCol - fromCol)
  
  // 왕은 3x3 영역 내에서만 이동 가능
  if (rowDiff <= 1 && colDiff <= 1) {
    // 초나라 왕은 위쪽 3x3 영역
    if (board.value[fromRow][fromCol].player === 'cho') {
      return toRow <= 2 && toCol >= 3 && toCol <= 5
    }
    // 한나라 왕은 아래쪽 3x3 영역
    else {
      return toRow >= 7 && toCol >= 3 && toCol <= 5
    }
  }
  return false
}

// 사(士) 이동 규칙
const isValidAdvisorMove = (fromRow, fromCol, toRow, toCol) => {
  const rowDiff = Math.abs(toRow - fromRow)
  const colDiff = Math.abs(toCol - fromCol)
  
  // 사는 대각선 또는 직선으로 한 칸씩 이동
  if ((rowDiff === 1 && colDiff === 1) || (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
    if (board.value[fromRow][fromCol].player === 'cho') {
      return toRow <= 2 && toCol >= 3 && toCol <= 5
    } else {
      return toRow >= 7 && toCol >= 3 && toCol <= 5
    }
  }
  return false
}

// 상(象) 이동 규칙
const isValidElephantMove = (fromRow, fromCol, toRow, toCol) => {
  const rowDiff = toRow - fromRow
  const colDiff = toCol - fromCol
  
  console.log(`상 이동 체크: (${fromRow},${fromCol}) → (${toRow},${toCol})`)
  console.log(`rowDiff: ${rowDiff}, colDiff: ${colDiff}`)
  
  // 상은 직선으로 한 칸 이동 후 그 방향으로 대각선 두 칸 이동
  if (Math.abs(rowDiff) === 3 && Math.abs(colDiff) === 2) {
    console.log('상 이동 패턴 일치!')
    
    // 직선 방향 계산
    let straightRow = 0, straightCol = 0
    
    if (rowDiff === 3) {
      straightRow = 1
      straightCol = 0
    } else if (rowDiff === -3) {
      straightRow = -1
      straightCol = 0
    } else if (colDiff === 2) {
      straightRow = 0
      straightCol = 1
    } else if (colDiff === -2) {
      straightRow = 0
      straightCol = -1
    }
    
    console.log(`직선 방향: (${straightRow}, ${straightCol})`)
    
    // 직선 경로에 말이 있는지 확인
    const straightRowPos = fromRow + straightRow
    const straightColPos = fromCol + straightCol
    const straightPiece = board.value[straightRowPos][straightColPos]
    console.log(`직선 경로 (${straightRowPos},${straightColPos}): ${straightPiece ? straightPiece.type : '빈칸'}`)
    
    if (straightPiece) {
      console.log('직선 경로에 말이 있어서 이동 불가')
      return false
    }
    
    // 대각선 경로에 말이 있는지 확인 (중간 지점)
    const midRow = fromRow + straightRow + (rowDiff / 3)
    const midCol = fromCol + straightCol + (colDiff / 2)
    const midPiece = board.value[midRow][midCol]
    console.log(`대각선 경로 (${midRow},${midCol}): ${midPiece ? midPiece.type : '빈칸'}`)
    
    if (midPiece) {
      console.log('대각선 경로에 말이 있어서 이동 불가')
      return false
    }
    
    // 목표 위치에 같은 편 말이 있는지 확인
    const targetPiece = board.value[toRow][toCol]
    console.log(`목표 위치 (${toRow},${toCol}): ${targetPiece ? targetPiece.type + ' (' + targetPiece.player + ')' : '빈칸'}`)
    
    if (targetPiece && targetPiece.player === board.value[fromRow][fromCol].player) {
      console.log('같은 편 말이 있어서 이동 불가')
      return false // 같은 편 말은 잡을 수 없음
    }
    
    // 상은 강을 건너서 상대방 진영으로 자유롭게 이동 가능 (영역 제한 없음)
    console.log('상 이동 가능! (영역 제한 없음)')
    return true
  } else {
    console.log('상 이동 패턴 불일치')
  }
  return false
}

// 마(馬) 이동 규칙
const isValidHorseMove = (fromRow, fromCol, toRow, toCol) => {
  const rowDiff = toRow - fromRow
  const colDiff = toCol - fromCol
  
  // 마는 직선으로 한 칸 이동 후 그 방향으로 대각선 한 칸 이동
  if ((Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) || 
      (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2)) {
    
    // 직선 방향 계산
    let straightRow = 0, straightCol = 0
    
    if (Math.abs(rowDiff) === 2) {
      straightRow = rowDiff > 0 ? 1 : -1
      straightCol = 0
    } else {
      straightRow = 0
      straightCol = colDiff > 0 ? 1 : -1
    }
    
    // 직선 경로에 말이 없어야 함 (말다리)
    const straightRowPos = fromRow + straightRow
    const straightColPos = fromCol + straightCol
    if (board.value[straightRowPos][straightColPos]) return false
    
    return true
  }
  return false
}

// 차(車) 이동 규칙
const isValidChariotMove = (fromRow, fromCol, toRow, toCol) => {
  const rowDiff = toRow - fromRow
  const colDiff = toCol - fromCol
  
  // 차는 직선으로만 이동
  if (rowDiff !== 0 && colDiff !== 0) {
    // 궁성 안에서는 대각선 이동도 가능
    if (Math.abs(rowDiff) === Math.abs(colDiff)) {
      // 궁성 안에 있는지 확인
      if (isInPalace(fromRow, fromCol) && isInPalace(toRow, toCol)) {
        // 궁성 안에서는 대각선 이동 가능 (한 칸, 두 칸 모두)
        // 경로에 말이 없는지 확인
        const rowStep = rowDiff > 0 ? 1 : -1
        const colStep = colDiff > 0 ? 1 : -1
        
        let currentRow = fromRow + rowStep
        let currentCol = fromCol + colStep
        
        while (currentRow !== toRow && currentCol !== toCol) {
          if (board.value[currentRow][currentCol]) return false
          currentRow += rowStep
          currentCol += colStep
        }
        
        return true
      }
    }
    return false
  }
  
  // 직선 이동 시 경로 체크
  const rowStep = rowDiff === 0 ? 0 : (rowDiff > 0 ? 1 : -1)
  const colStep = colDiff === 0 ? 0 : (colDiff > 0 ? 1 : -1)
  
  let currentRow = fromRow + rowStep
  let currentCol = fromCol + colStep
  
  while (currentRow !== toRow || currentCol !== toCol) {
    if (board.value[currentRow][currentCol]) return false
    currentRow += rowStep
    currentCol += colStep
  }
  
  return true
}

// 포(包) 이동 규칙
const isValidCannonMove = (fromRow, fromCol, toRow, toCol) => {
  const rowDiff = toRow - fromRow
  const colDiff = toCol - fromCol
  
  // 포는 직선으로만 이동
  if (rowDiff !== 0 && colDiff !== 0) {
    // 궁성 안에서는 대각선 이동도 가능
    if (Math.abs(rowDiff) === Math.abs(colDiff)) {
      // 궁성 안에 있는지 확인
      if (isInPalace(fromRow, fromCol) && isInPalace(toRow, toCol)) {
        // 궁성 안에서도 포는 반드시 말을 뛰어넘어야 함
        // 경로에 말이 있는지 확인
        const rowStep = rowDiff > 0 ? 1 : -1
        const colStep = colDiff > 0 ? 1 : -1
        
        let currentRow = fromRow + rowStep
        let currentCol = fromCol + colStep
        let pieceCount = 0
        
        while (currentRow !== toRow && currentCol !== toCol) {
          if (board.value[currentRow][currentCol]) {
            // 경로에 포가 있으면 뛰어넘을 수 없음
            if (board.value[currentRow][currentCol].type === '包') return false
            pieceCount++
          }
          currentRow += rowStep
          currentCol += colStep
        }
        
        // 목표 위치에 같은 편 말이 있는지 확인
        const targetPiece = board.value[toRow][toCol]
        if (targetPiece && targetPiece.player === board.value[fromRow][fromCol].player) {
          return false // 같은 편 말은 잡을 수 없음
        }
        
        // 포는 반드시 정확히 하나의 말을 뛰어넘어야 함
        if (targetPiece) {
          // 상대방 말을 잡을 때는 정확히 하나의 말이 경로에 있어야 함
          return pieceCount === 1
        } else {
          // 빈 칸으로 이동할 때도 정확히 하나의 말을 넘어야 함
          return pieceCount === 1
        }
      }
    }
    return false
  }
  
  // 목표 위치에 말이 있는지 확인
  const targetPiece = board.value[toRow][toCol]
  
  // 포는 포를 잡을 수 없음
  if (targetPiece && targetPiece.type === '包') return false
  
  // 경로에 말이 있는지 확인
  const minRow = Math.min(fromRow, toRow)
  const maxRow = Math.max(fromRow, toRow)
  const minCol = Math.min(fromCol, toCol)
  const maxCol = Math.max(fromCol, toCol)
  
  let pieceCount = 0
  
  if (rowDiff === 0) {
    // 가로 이동
    for (let col = minCol + 1; col < maxCol; col++) {
      if (board.value[fromRow][col]) {
        // 경로에 포가 있으면 뛰어넘을 수 없음
        if (board.value[fromRow][col].type === '包') return false
        pieceCount++
      }
    }
  } else {
    // 세로 이동
    for (let row = minRow + 1; row < maxRow; row++) {
      if (board.value[row][fromCol]) {
        // 경로에 포가 있으면 뛰어넘을 수 없음
        if (board.value[row][fromCol].type === '包') return false
        pieceCount++
      }
    }
  }
  
  // 포는 반드시 다른 말 하나를 넘어야만 이동 가능
  if (targetPiece) {
    // 상대방 말을 잡을 때는 정확히 하나의 말이 경로에 있어야 함
    return pieceCount === 1
  } else {
    // 빈 칸으로 이동할 때도 정확히 하나의 말을 넘어야 함
    return pieceCount === 1
  }
}

// 졸(卒) 이동 규칙
const isValidPawnMove = (fromRow, fromCol, toRow, toCol) => {
  const rowDiff = toRow - fromRow
  const colDiff = toCol - fromCol
  
  // 졸은 직선으로만 이동 (대각선 불가)
  if (Math.abs(rowDiff) + Math.abs(colDiff) !== 1) return false
  
  if (board.value[fromRow][fromCol].player === 'cho') {
    // 초나라 졸: 앞으로만 이동 가능 (row 증가)
    if (colDiff === 0 && rowDiff === 1) return true
    // 좌우 이동 가능
    if (rowDiff === 0 && Math.abs(colDiff) === 1) return true
  } else {
    // 한나라 졸: 뒤로만 이동 가능 (row 감소)
    if (colDiff === 0 && rowDiff === -1) return true
    // 좌우 이동 가능
    if (rowDiff === 0 && Math.abs(colDiff) === 1) return true
  }
  
  return false
}

// 승리 조건 체크 함수
const checkForVictory = (capturedPiece) => {
  if (capturedPiece && capturedPiece.type === '王') {
    gameOver.value = true
    setTimeout(() => {
      alert(`${currentPlayer.value === 'cho' ? '초나라' : '한나라'} 승리!`)
    }, 100)
    return true
  }
  return false
}

// 말 이동 함수
const makeMove = (toRow, toCol) => {
  if (!selectedPiece.value) return
  
  const piece = board.value[selectedPiece.value.row][selectedPiece.value.col]
  if (!piece || piece.player !== currentPlayer.value) return
  
  if (isValidMove(selectedPiece.value.row, selectedPiece.value.col, toRow, toCol)) {
    // 이동 기록 저장
    const moveRecord = {
      from: { row: selectedPiece.value.row, col: selectedPiece.value.col },
      to: { row: toRow, col: toCol },
      piece: piece.type,
      player: piece.player,
      captured: board.value[toRow][toCol]
    }
    
    // 말 이동
    board.value[toRow][toCol] = piece
    board.value[selectedPiece.value.row][selectedPiece.value.col] = null
    
    // 이동 기록에 추가
    moveHistory.value.push(moveRecord)
    
    // 승리 조건 체크
    checkForVictory(moveRecord.captured)
    
    // 선택 해제
    selectedPiece.value = null
    
    // 플레이어 변경
    currentPlayer.value = currentPlayer.value === 'cho' ? 'han' : 'cho'
    
    // 상대방 차례가 시작되기 전에 장군 체크
    checkForCheck()
  }
}

// 한수 무르기
const undoMove = () => {
  if (moveHistory.value.length === 0) return
  
  const lastMove = moveHistory.value.pop()
  const { from, to, piece, player, captured } = lastMove
  
  // 말 되돌리기 - 완전한 말 객체 생성
  const restoredPiece = {
    type: piece,
    player: player
  }
  board.value[from.row][from.col] = restoredPiece
  board.value[to.row][to.col] = captured
  
  // 차례 되돌리기
  currentPlayer.value = currentPlayer.value === 'cho' ? 'han' : 'cho'
  
  selectedPiece.value = null
  gameOver.value = false
  drawBoard()
}

// 게임 재시작
const resetGame = () => {
  initGame()
  drawBoard()
}

// 게임판 그리기
const drawBoard = () => {
  if (!boardCanvas.value) return
  
  const ctx = boardCanvas.value.getContext('2d')
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  
  // 배경
  ctx.fillStyle = '#f8f9fa'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  
  // 격자 그리기
  drawGrid(ctx)
  
  // 궁성 그리기
  drawPalace(ctx)
  
  // 강 그리기
  drawRiver(ctx)
  
  // 말 그리기
  drawPieces(ctx)
  
  // 선택된 말 강조
  highlightSelectedPiece(ctx)
  
  // 유효한 이동 위치 표시
  drawValidMoves(ctx)
}

// 격자 그리기
const drawGrid = (ctx) => {
  ctx.strokeStyle = '#2c3e50'
  ctx.lineWidth = 1
  
  // 세로선 (9개)
  for (let col = 0; col < 9; col++) {
    const x = boardOffset.x + col * cellSize
    ctx.beginPath()
    ctx.moveTo(x, boardOffset.y)
    ctx.lineTo(x, boardOffset.y + 9 * cellSize)
    ctx.stroke()
  }
  
  // 가로선 (10개)
  for (let row = 0; row < 10; row++) {
    const y = boardOffset.y + row * cellSize
    ctx.beginPath()
    ctx.moveTo(boardOffset.x, y)
    ctx.lineTo(boardOffset.x + 8 * cellSize, y)
    ctx.stroke()
  }
}

// 궁성 그리기
const drawPalace = (ctx) => {
  ctx.strokeStyle = '#e74c3c'
  ctx.lineWidth = 2
  
  // 초나라 궁성 (위쪽)
  ctx.strokeRect(
    boardOffset.x + 3 * cellSize, 
    boardOffset.y, 
    2 * cellSize, 
    2 * cellSize
  )
  
  // 한나라 궁성 (아래쪽)
  ctx.strokeRect(
    boardOffset.x + 3 * cellSize, 
    boardOffset.y + 7 * cellSize, 
    2 * cellSize, 
    2 * cellSize
  )
  
  // 궁성 대각선
  ctx.beginPath()
  // 초나라 궁성 대각선
  ctx.moveTo(boardOffset.x + 3 * cellSize, boardOffset.y)
  ctx.lineTo(boardOffset.x + 5 * cellSize, boardOffset.y + 2 * cellSize)
  ctx.moveTo(boardOffset.x + 5 * cellSize, boardOffset.y)
  ctx.lineTo(boardOffset.x + 3 * cellSize, boardOffset.y + 2 * cellSize)
  
  // 한나라 궁성 대각선
  ctx.moveTo(boardOffset.x + 3 * cellSize, boardOffset.y + 7 * cellSize)
  ctx.lineTo(boardOffset.x + 5 * cellSize, boardOffset.y + 9 * cellSize)
  ctx.moveTo(boardOffset.x + 5 * cellSize, boardOffset.y + 7 * cellSize)
  ctx.lineTo(boardOffset.x + 3 * cellSize, boardOffset.y + 9 * cellSize)
  ctx.stroke()
}

// 강 그리기
const drawRiver = (ctx) => {
  ctx.strokeStyle = '#3498db'
  ctx.lineWidth = 3
  
  // 가운데 강 (4-5줄 사이)
  const riverY = boardOffset.y + 4.5 * cellSize
  ctx.beginPath()
  ctx.moveTo(boardOffset.x, riverY)
  ctx.lineTo(boardOffset.x + 8 * cellSize, riverY)
  ctx.stroke()
  
  // 강 표시 (물결 모양)
  ctx.strokeStyle = '#2980b9'
  ctx.lineWidth = 1
  for (let i = 0; i < 8; i++) {
    const x = boardOffset.x + i * cellSize + cellSize / 2
    const y = riverY
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, 2 * Math.PI)
    ctx.stroke()
  }
}

// 말 그리기
const drawPieces = (ctx) => {
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board.value[row][col]
      if (piece) {
        drawPiece(ctx, row, col, piece)
      }
    }
  }
}

// 개별 말 그리기
const drawPiece = (ctx, row, col, piece) => {
  const x = boardOffset.x + col * cellSize
  const y = boardOffset.y + row * cellSize
  const radius = cellSize * 0.4
  
  // 말 배경 원
  ctx.fillStyle = piece.player === 'cho' ? '#3498db' : '#e74c3c'
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 2 * Math.PI)
  ctx.fill()
  
  // 말 테두리
  ctx.strokeStyle = '#2c3e50'
  ctx.lineWidth = 2
  ctx.stroke()
  
  // 말 이름
  ctx.fillStyle = 'white'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(piece.type, x, y)
}

// 선택된 말 강조
const highlightSelectedPiece = (ctx) => {
  if (!selectedPiece.value) return
  
  const x = boardOffset.x + selectedPiece.value.col * cellSize
  const y = boardOffset.y + selectedPiece.value.row * cellSize
  const radius = cellSize * 0.45
  
  ctx.strokeStyle = '#f39c12'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 2 * Math.PI)
  ctx.stroke()
}

// 유효한 이동 위치 표시
const drawValidMoves = (ctx) => {
  if (!selectedPiece.value) return
  
  const piece = board.value[selectedPiece.value.row][selectedPiece.value.col]
  if (!piece) return
  
  ctx.strokeStyle = '#27ae60'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      if (isValidMove(selectedPiece.value.row, selectedPiece.value.col, row, col)) {
        const x = boardOffset.x + col * cellSize
        const y = boardOffset.y + row * cellSize
        const radius = cellSize * 0.3
        
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.stroke()
      }
    }
  }
  
  ctx.setLineDash([])
}

// 장군(將軍) 체크 함수
const checkForCheck = () => {
  const currentPlayerValue = currentPlayer.value
  const myKing = currentPlayerValue // 현재 플레이어의 장
  const opponentPlayer = currentPlayerValue === 'cho' ? 'han' : 'cho' // 상대방
  
  // 내 장의 위치 찾기
  let myKingRow = -1
  let myKingCol = -1
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board.value[row][col]
      if (piece && piece.type === '王' && piece.player === myKing) {
        myKingRow = row
        myKingCol = col
        break
      }
    }
    if (myKingRow !== -1) break
  }
  
  if (myKingRow === -1) return // 내 장을 찾을 수 없음
  
  // 상대방 말 중에서 내 장을 잡을 수 있는 말이 있는지 확인
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board.value[row][col]
      if (piece && piece.player === opponentPlayer) {
        // 상대방 말이 내 장을 잡을 수 있는지 확인
        if (isValidMove(row, col, myKingRow, myKingCol)) {
          checkMessage.value = '장군!!'
          showCheck.value = true
          setTimeout(() => {
            showCheck.value = false
          }, 3000)
          return
        }
      }
    }
  }
}

// 컴포넌트 마운트 시 초기화
onMounted(() => {
  initGame()
  drawBoard()
})

// 궁성 안에 있는지 확인하는 함수
const isInPalace = (row, col) => {
  // 초나라 궁성 (0-2줄, 3-5열)
  if (row <= 2 && col >= 3 && col <= 5) return true
  
  // 한나라 궁성 (7-9줄, 3-5열)
  if (row >= 7 && col >= 3 && col <= 5) return true
  
  return false
}
</script>

<style scoped>
.game-board {
  display: flex;
  justify-content: center;
}

.board-canvas {
  border: 3px solid #2c3e50;
  border-radius: 10px;
  background: #f8f9fa;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.check-message {
  position: relative;
  z-index: 1000;
}

.check-message .alert {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(231, 76, 60, 0.4);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  animation: checkPulse 2s infinite;
}

@keyframes checkPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

h1 {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
