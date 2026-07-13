// Puzzle System - Manages navigation, unlocking, and answer validation

const PAGES = ['index', 'hand', 'birch', 'toy', 'apple', 'river', 'young', 'imagine', 'plan', 'hollow'];
const PAGE_LABELS = {
    index: 'Home'
};

// Define correct answers for each puzzle page (case-insensitive)
const ANSWERS = {
    hand: 'hello nono',
    apple: 'im glad to have met you three',
    plan: 'years ago. i now look back to all the',
    young: 'moments we shared, and every',
    birch: 'memory imprints a smile on my face. our friendship brings',
    imagine: 'me true joy',
    river: 'i look forward to making many new',
    toy: 'memories in the future',
    hollow: 'happy birthday',
};

// Complete message when all answers are combined in HAPYBIRTH order (H-A-P-Y-B-I-R-T-H)
const COMPLETE_MESSAGE = 'hello nono im glad to have met you three years ago. i now look back to all the moments we shared, and every memory imprints a smile on my face. our friendship brings me true joy. i look forward to making many new memories in the future. happy birthday';

// Order of page indices for the final message (spell HAPYBIRTH)
const FINAL_MESSAGE_ORDER = ['hand', 'apple', 'plan', 'young', 'birch', 'imagine', 'river', 'toy', 'hollow'];

// Initialize unlock state in localStorage
function initUnlocks() {
    if (!localStorage.getItem('unlockedPages')) {
        const unlocked = { index: true }; // index is always unlocked
        localStorage.setItem('unlockedPages', JSON.stringify(unlocked));
    }
    if (!localStorage.getItem('solvedPuzzles')) {
        localStorage.setItem('solvedPuzzles', JSON.stringify({}));
    }
}

// Check if a page is unlocked
function isPageUnlocked(pageName) {
    initUnlocks();
    const unlocked = JSON.parse(localStorage.getItem('unlockedPages'));
    return unlocked[pageName] === true;
}

// Unlock a page
function unlockPage(pageName) {
    initUnlocks();
    const unlocked = JSON.parse(localStorage.getItem('unlockedPages'));
    unlocked[pageName] = true;
    localStorage.setItem('unlockedPages', JSON.stringify(unlocked));
}

// Mark a puzzle as solved
function solvePuzzle(pageName) {
    initUnlocks();
    const solved = JSON.parse(localStorage.getItem('solvedPuzzles'));
    solved[pageName] = true;
    localStorage.setItem('solvedPuzzles', JSON.stringify(solved));
}

// Check if a puzzle is solved
function isPuzzleSolved(pageName) {
    initUnlocks();
    const solved = JSON.parse(localStorage.getItem('solvedPuzzles'));
    return solved[pageName] === true;
}

// Validate answer and unlock next page
function validateAnswer(currentPage) {
    const input = document.getElementById('answerInput');
    if (!input) return false;

    // Remove punctuation and extra spaces, convert to lowercase
    const sanitize = (text) => text.toLowerCase().replace(/[.,!?;:\-'"]/g, '').replace(/\s+/g, ' ').trim();

    const userAnswer = sanitize(input.value);
    const correctAnswer = sanitize(ANSWERS[currentPage]);

    if (userAnswer === correctAnswer) {
        // Mark puzzle as solved
        solvePuzzle(currentPage);
        
        // Display the answer
        displayAnswer(currentPage);
        
        // Find and unlock next page
        const currentIndex = PAGES.indexOf(currentPage);
        if (currentIndex < PAGES.length - 1) {
            const nextPage = PAGES[currentIndex + 1];
            unlockPage(nextPage);
            
            // Show success message and redirect after slight delay
            alert('Correct! Next page unlocked.');
            setTimeout(() => {
                window.location.href = nextPage + '.html';
            }, 500);
        } else {
            // Final page reached - redirect to index
            alert('You have completed all puzzles! Now go back to the Home Page to piece them together.');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
        return true;
    } else {
        alert('Incorrect. Try again.');
        input.value = '';
        return false;
    }
}

// Display the answer on the page
function displayAnswer(pageName) {
    const inputSection = document.getElementById('inputSection');
    if (!inputSection) return;
    
    inputSection.innerHTML = `
        <div style="margin-top: 20px; padding: 10px 12px; border: 1px solid #555; border-radius: 4px; background-color: #2a2a2a;">
            <p style="margin: 0; color: #aaa; font-size: 14px;">Your answer:</p>
            <p style="font-size: 18px; color: #d0d0d0; font-weight: bold; margin: 5px 0;">${ANSWERS[pageName]}</p>
        </div>
    `;
}

function addBottomPadding() {
    const message = document.querySelector('.message');
    if (message) {
        message.style.paddingBottom = '120px';
    }
}

// Navigate to a page (with unlock check)
function navigateToPage(pageName) {
    if (isPageUnlocked(pageName)) {
        window.location.href = pageName + '.html';
    } else {
        alert('This page is locked. Complete the previous puzzles to unlock it.');
    }
}

// Get the list of unlocked pages
function getUnlockedPages() {
    initUnlocks();
    return JSON.parse(localStorage.getItem('unlockedPages'));
}

// Get current page name from filename
function getCurrentPageName() {
    const currentFile = window.location.pathname.split('/').pop().replace('.html', '');
    return currentFile;
}

// Create navigation bar for unlocked pages
function createNavBar() {
    const currentPage = getCurrentPageName();
    const unlocked = getUnlockedPages();
    
    // Create nav container if it doesn't exist
    let navBar = document.getElementById('navBar');
    if (!navBar) {
        navBar = document.createElement('div');
        navBar.id = 'navBar';
        navBar.style.cssText = `
            position: fixed;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 1000;
        `;
        document.body.appendChild(navBar);
    }
    
    // Add navigation buttons for unlocked pages
    PAGES.forEach(page => {
        if (unlocked[page]) {
            const btn = document.createElement('button');
            const label = PAGE_LABELS[page] || page.charAt(0).toUpperCase();
            btn.textContent = label;
            btn.style.cssText = `
                padding: 8px 16px;
                background-color: ${page === currentPage ? '#222' : '#333'};
                color: white;
                border: 1px solid ${page === currentPage ? '#888' : '#666'};
                border-radius: 4px;
                cursor: ${page === currentPage ? 'default' : 'pointer'};
                font-family: "Courier New", monospace;
                font-size: 14px;
            `;
            if (page !== currentPage) {
                btn.onclick = () => navigateToPage(page);
                btn.onmouseover = () => btn.style.backgroundColor = '#555';
                btn.onmouseout = () => btn.style.backgroundColor = '#333';
            }
            navBar.appendChild(btn);
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initUnlocks();
    
    // Get current page name
    const currentPage = getCurrentPageName();
    
    // Check if puzzle is already solved and display answer if so
    if (currentPage !== 'index' && isPuzzleSolved(currentPage)) {
        displayAnswer(currentPage);
    }
    
    // Create nav bar for all unlocked pages
    if (currentPage !== 'index' || isPageUnlocked('hollow')) {
        createNavBar();
    }

    // Add bottom padding so there is extra scroll space
    if (currentPage !== 'index') {
        addBottomPadding();
    }
    
    // If on hollow page, set up complete message input
    if (currentPage === 'hollow') {
        setupCompleteMessageInput();
    }
});

// Validate complete message and show keys
function validateCompleteMessage() {
    const input = document.getElementById('completeMessageInput');
    if (!input) return false;

    // Remove punctuation and extra spaces, convert to lowercase
    const sanitize = (text) => text.toLowerCase().replace(/[.,!?;:\-'"]/g, '').replace(/\s+/g, ' ').trim();

    const userMessage = sanitize(input.value);
    const correctMessage = sanitize(COMPLETE_MESSAGE);

    if (userMessage === correctMessage) {
        alert('🎉 Congratulations! You have solved the puzzle!');
        displayGameKeys();
        return true;
    } else {
        alert('Not quite right. Keep checking your answers and try again!');
        return false;
    }
}

// Setup the complete message input area
function setupCompleteMessageInput() {
    const messageDiv = document.getElementById('completeMessageDiv');
    if (messageDiv) {
        messageDiv.innerHTML = `
            <div style="margin-top: 40px; max-width: 600px;">
                <p style="font-size: 20px; margin-bottom: 15px;">Piece together all your answers:</p>
                <textarea id="completeMessageInput" style="
                    width: 100%;
                    height: 120px;
                    padding: 12px;
                    background-color: #222;
                    color: white;
                    border: 1px solid #666;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    resize: vertical;
                " placeholder="Type the complete message here..."></textarea>
                <button onclick="validateCompleteMessage()" style="
                    margin-top: 15px;
                    padding: 10px 25px;
                    font-size: 16px;
                    background-color: #333;
                    color: white;
                    border: 1px solid #666;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                " onmouseover="this.style.backgroundColor='#555'" onmouseout="this.style.backgroundColor='#333'">Submit Complete Message</button>
            </div>
        `;
        
        // Restore saved input and add auto-save
        const input = document.getElementById('completeMessageInput');
        if (input) {
            const savedMessage = localStorage.getItem('completeMessage');
            if (savedMessage) {
                input.value = savedMessage;
            }
            
            input.addEventListener('input', function() {
                localStorage.setItem('completeMessage', this.value);
            });
        }
    }
}

// Display game keys
function displayGameKeys() {
    const keysDiv = document.getElementById('gameKeysDiv');
    if (keysDiv) {
        keysDiv.innerHTML = `
            <div style="margin-top: 40px; padding: 20px; border: 2px solid #00ff00; border-radius: 4px; background-color: #1a2a1a;">
                <h3 style="color: #00ff00; margin-top: 0;">🎮 Your Game Keys 🎮</h3>
                <p style="color: #d0d0d0;">Here are your redeemable Steam game keys:</p>
                <div style="background-color: #0a0a0a; padding: 15px; border-radius: 4px; margin-top: 15px;">
                    <p style="margin: 10px 0; color: #00ff00; font-family: 'Courier New', monospace; font-size: 16px;">0L57A-0WX0V-JJYB7</p>
                    <p style="margin: 10px 0; color: #00ff00; font-family: 'Courier New', monospace; font-size: 16px;">IDW02-VC4XL-QGVBG</p>
                </div>
                <p style="color: #ffcc00; margin-top: 15px; font-size: 13px;">⚠️ If these keys don't work, please message me!</p>
                <p style="color: #aaa; margin-top: 10px; font-size: 14px;">Enjoy your games! 🎉</p>
            </div>
        `;
    }
}
