class SudokuGame {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.prefilled = Array(9).fill().map(() => Array(9).fill(false));
        this.timer = null;
        this.startTime = null;
        this.currentTime = 0;
        this.selectedCell = null;
        this.hintsUsed = 0;
        this.isGameComplete = false;
        
        this.initializeGame();
        this.setupEventListeners();
        this.loadStats();
        this.updateDisplay();
    }

    initializeGame() {
        this.createBoard();
        this.generatePuzzle();
        this.startTimer();
    }

    createBoard() {
        const boardElement = document.getElementById('sudokuBoard');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('input');
            cell.type = 'text';
            cell.className = 'sudoku-cell';
            cell.maxLength = 1;
            cell.dataset.index = i;
            
            // Add event listeners for cell interaction
            cell.addEventListener('input', (e) => this.handleCellInput(e));
            cell.addEventListener('focus', (e) => this.handleCellFocus(e));
            cell.addEventListener('keydown', (e) => this.handleKeyNavigation(e));
            
            boardElement.appendChild(cell);
        }
    }

    generatePuzzle() {
        // Generate a complete valid Sudoku solution
        this.generateCompleteSolution();
        
        // Copy solution to board
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                this.board[i][j] = this.solution[i][j];
            }
        }
        
        // Remove numbers based on difficulty
        this.createPuzzle();
        this.updateBoardDisplay();
    }

    generateCompleteSolution() {
        // Clear the solution board
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        
        // Use backtracking to generate a complete solution
        this.solveSudoku(this.solution);
    }

    solveSudoku(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    // Try numbers 1-9 in random order
                    const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    
                    for (let num of numbers) {
                        if (this.isValidMove(board, row, col, num)) {
                            board[row][col] = num;
                            
                            if (this.solveSudoku(board)) {
                                return true;
                            }
                            
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    createPuzzle() {
        const difficulty = document.getElementById('difficulty').value;
        let cellsToRemove;
        
        switch (difficulty) {
            case 'easy':
                cellsToRemove = 35;
                break;
            case 'medium':
                cellsToRemove = 45;
                break;
            case 'hard':
                cellsToRemove = 55;
                break;
            default:
                cellsToRemove = 45;
        }
        
        // Reset prefilled array
        this.prefilled = Array(9).fill().map(() => Array(9).fill(false));
        
        // Mark all cells as prefilled initially
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                this.prefilled[i][j] = true;
            }
        }
        
        // Remove cells randomly
        const positions = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push([i, j]);
            }
        }
        
        const shuffledPositions = this.shuffleArray(positions);
        
        for (let i = 0; i < cellsToRemove && i < shuffledPositions.length; i++) {
            const [row, col] = shuffledPositions[i];
            this.board[row][col] = 0;
            this.prefilled[row][col] = false;
        }
    }

    updateBoardDisplay() {
        const cells = document.querySelectorAll('.sudoku-cell');
        
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const value = this.board[row][col];
            
            cell.value = value === 0 ? '' : value;
            cell.classList.remove('prefilled', 'invalid', 'hint', 'solved');
            
            if (this.prefilled[row][col]) {
                cell.classList.add('prefilled');
                cell.readOnly = true;
            } else {
                cell.readOnly = false;
            }
        });
    }

    handleCellInput(event) {
        const cell = event.target;
        const index = parseInt(cell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;
        const value = cell.value;
        
        // Only allow numbers 1-9
        if (value && (!/^[1-9]$/.test(value))) {
            cell.value = '';
            return;
        }
        
        // Update board state
        this.board[row][col] = value ? parseInt(value) : 0;
        
        // Clear previous styling
        cell.classList.remove('invalid', 'hint');
        
        // Validate the move
        if (value && !this.isValidMove(this.board, row, col, parseInt(value), true)) {
            cell.classList.add('invalid');
            this.showMessage('Invalid move! Number already exists in row, column, or box.', 'error');
        } else {
            this.clearMessage();
        }
        
        // Check if puzzle is solved
        if (this.isPuzzleComplete()) {
            this.handlePuzzleComplete();
        }
    }

    handleCellFocus(event) {
        this.selectedCell = event.target;
    }

    handleKeyNavigation(event) {
        if (!this.selectedCell) return;
        
        const index = parseInt(this.selectedCell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;
        let newIndex = index;
        
        switch (event.key) {
            case 'ArrowUp':
                if (row > 0) newIndex = (row - 1) * 9 + col;
                event.preventDefault();
                break;
            case 'ArrowDown':
                if (row < 8) newIndex = (row + 1) * 9 + col;
                event.preventDefault();
                break;
            case 'ArrowLeft':
                if (col > 0) newIndex = row * 9 + (col - 1);
                event.preventDefault();
                break;
            case 'ArrowRight':
                if (col < 8) newIndex = row * 9 + (col + 1);
                event.preventDefault();
                break;
        }
        
        if (newIndex !== index) {
            const cells = document.querySelectorAll('.sudoku-cell');
            cells[newIndex].focus();
        }
    }

    isValidMove(board, row, col, num, skipSelf = false) {
        // Check row
        for (let j = 0; j < 9; j++) {
            if (j !== col && board[row][j] === num) {
                return false;
            }
        }
        
        // Check column
        for (let i = 0; i < 9; i++) {
            if (i !== row && board[i][col] === num) {
                return false;
            }
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
                if ((i !== row || j !== col) && board[i][j] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }

    isPuzzleComplete() {
        // Check if all cells are filled
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] === 0) {
                    return false;
                }
            }
        }
        
        // Check if solution is valid
        return this.isValidSolution();
    }

    isValidSolution() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const num = this.board[i][j];
                if (num === 0 || !this.isValidMove(this.board, i, j, num, true)) {
                    return false;
                }
            }
        }
        return true;
    }

    handlePuzzleComplete() {
        this.isGameComplete = true;
        this.stopTimer();
        
        // Add solved styling to all cells
        const cells = document.querySelectorAll('.sudoku-cell');
        cells.forEach(cell => cell.classList.add('solved'));
        
        // Update stats
        this.updateStats();
        
        // Show success modal
        this.showSuccessModal();
    }

    checkSolution() {
        if (this.isPuzzleComplete()) {
            this.handlePuzzleComplete();
        } else {
            // Highlight invalid cells
            const cells = document.querySelectorAll('.sudoku-cell');
            let hasErrors = false;
            
            cells.forEach((cell, index) => {
                const row = Math.floor(index / 9);
                const col = index % 9;
                const value = this.board[row][col];
                
                cell.classList.remove('invalid');
                
                if (value !== 0 && !this.isValidMove(this.board, row, col, value, true)) {
                    cell.classList.add('invalid');
                    hasErrors = true;
                }
            });
            
            if (hasErrors) {
                this.showMessage('There are errors in your solution. Check highlighted cells.', 'error');
            } else {
                this.showMessage('Looking good so far! Keep going.', 'info');
            }
        }
    }

    giveHint() {
        if (this.isGameComplete) return;
        
        // Find empty cells
        const emptyCells = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] === 0) {
                    emptyCells.push([i, j]);
                }
            }
        }
        
        if (emptyCells.length === 0) return;
        
        // Pick a random empty cell
        const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const correctValue = this.solution[row][col];
        
        // Fill the cell
        this.board[row][col] = correctValue;
        
        // Update display
        const cellIndex = row * 9 + col;
        const cell = document.querySelectorAll('.sudoku-cell')[cellIndex];
        cell.value = correctValue;
        cell.classList.add('hint');
        
        this.hintsUsed++;
        this.showMessage(`Hint: Cell filled with ${correctValue}`, 'info');
        
        // Check if puzzle is now complete
        if (this.isPuzzleComplete()) {
            this.handlePuzzleComplete();
        }
    }

    resetGame() {
        // Show confirmation modal
        const modal = document.getElementById('resetModal');
        modal.classList.add('show');
    }

    confirmReset() {
        // Reset board to initial state
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (!this.prefilled[i][j]) {
                    this.board[i][j] = 0;
                }
            }
        }
        
        this.updateBoardDisplay();
        this.clearMessage();
        this.hintsUsed = 0;
        this.isGameComplete = false;
        
        // Reset timer
        this.stopTimer();
        this.startTimer();
        
        // Hide modal
        document.getElementById('resetModal').classList.remove('show');
    }

    newGame() {
        this.stopTimer();
        this.isGameComplete = false;
        this.hintsUsed = 0;
        this.clearMessage();
        this.generatePuzzle();
        this.startTimer();
    }

    startTimer() {
        this.startTime = Date.now();
        this.currentTime = 0;
        
        this.timer = setInterval(() => {
            if (!this.isGameComplete) {
                this.currentTime = Date.now() - this.startTime;
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.currentTime / 60000);
        const seconds = Math.floor((this.currentTime % 60000) / 1000);
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer').textContent = timeString;
    }

    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateStats() {
        const stats = this.getStats();
        const difficulty = document.getElementById('difficulty').value;
        
        // Update puzzles solved
        stats.puzzlesSolved++;
        
        // Update best time for this difficulty
        if (!stats.bestTimes[difficulty] || this.currentTime < stats.bestTimes[difficulty]) {
            stats.bestTimes[difficulty] = this.currentTime;
        }
        
        // Add to leaderboard
        stats.leaderboard.push({
            time: this.currentTime,
            difficulty: difficulty,
            date: new Date().toLocaleDateString()
        });
        
        // Sort leaderboard by time and keep top 10
        stats.leaderboard.sort((a, b) => a.time - b.time);
        stats.leaderboard = stats.leaderboard.slice(0, 10);
        
        this.saveStats(stats);
        this.updateDisplay();
    }

    getStats() {
        const defaultStats = {
            puzzlesSolved: 0,
            bestTimes: {},
            leaderboard: []
        };
        
        const saved = localStorage.getItem('sudokuStats');
        return saved ? JSON.parse(saved) : defaultStats;
    }

    saveStats(stats) {
        localStorage.setItem('sudokuStats', JSON.stringify(stats));
    }

    loadStats() {
        const stats = this.getStats();
        this.updateDisplay();
    }

    updateDisplay() {
        const stats = this.getStats();
        const difficulty = document.getElementById('difficulty').value;
        
        // Update stats display
        document.getElementById('puzzlesSolved').textContent = stats.puzzlesSolved;
        
        const bestTime = stats.bestTimes[difficulty];
        document.getElementById('bestTime').textContent = bestTime ? this.formatTime(bestTime) : '--:--';
        
        // Update leaderboard
        this.updateLeaderboard(stats.leaderboard);
    }

    updateLeaderboard(leaderboard) {
        const leaderboardElement = document.getElementById('leaderboard');
        leaderboardElement.innerHTML = '';
        
        if (leaderboard.length === 0) {
            leaderboardElement.innerHTML = '<p style="color: var(--text-muted);">No games completed yet</p>';
            return;
        }
        
        leaderboard.forEach((entry, index) => {
            const entryElement = document.createElement('div');
            entryElement.className = 'leaderboard-entry';
            entryElement.innerHTML = `
                <span>#${index + 1} - ${entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}</span>
                <span>${this.formatTime(entry.time)}</span>
            `;
            leaderboardElement.appendChild(entryElement);
        });
    }

    clearStats() {
        if (confirm('Are you sure you want to clear all statistics? This cannot be undone.')) {
            localStorage.removeItem('sudokuStats');
            this.updateDisplay();
            this.showMessage('Statistics cleared successfully!', 'info');
        }
    }

    showMessage(message, type) {
        const messageDisplay = document.getElementById('messageDisplay');
        messageDisplay.textContent = message;
        messageDisplay.className = `message-display ${type}`;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.clearMessage();
        }, 3000);
    }

    clearMessage() {
        const messageDisplay = document.getElementById('messageDisplay');
        messageDisplay.textContent = '';
        messageDisplay.className = 'message-display';
    }

    showSuccessModal() {
        const modal = document.getElementById('successModal');
        const difficulty = document.getElementById('difficulty').value;
        
        document.getElementById('finalTime').textContent = this.formatTime(this.currentTime);
        document.getElementById('finalDifficulty').textContent = 
            difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        
        modal.classList.add('show');
    }

    toggleTheme() {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('sudokuTheme', newTheme);
        
        // Update theme toggle icon
        const icon = document.querySelector('#themeToggle i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('sudokuTheme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    setupEventListeners() {
        // Game control buttons
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('checkBtn').addEventListener('click', () => this.checkSolution());
        document.getElementById('hintBtn').addEventListener('click', () => this.giveHint());
        
        // Modal buttons
        document.getElementById('confirmReset').addEventListener('click', () => this.confirmReset());
        document.getElementById('cancelReset').addEventListener('click', () => {
            document.getElementById('resetModal').classList.remove('show');
        });
        
        document.getElementById('closeSuccessModal').addEventListener('click', () => {
            document.getElementById('successModal').classList.remove('show');
            this.newGame();
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Difficulty change
        document.getElementById('difficulty').addEventListener('change', () => {
            this.updateDisplay();
        });
        
        // Clear stats
        document.getElementById('clearStatsBtn').addEventListener('click', () => this.clearStats());
        
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });
        
        // Load theme on startup
        this.loadTheme();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});