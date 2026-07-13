// Puzzle System - Manages navigation, unlocking, and answer validation

const PAGES = ['index', 'hand', 'birch', 'toy', 'apple', 'river', 'young', 'imagine', 'plan', 'hollow'];
const PAGE_LABELS = {
    index: 'Home'
};

// Firebase config placeholder - create a Firebase project and replace these values
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAAnn5snmVUPua3gJXpPVENw7vHt4yAYX4",
  authDomain: "nono-bday-present-2026.firebaseapp.com",
  databaseURL: "https://nono-bday-present-2026-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "nono-bday-present-2026",
  storageBucket: "nono-bday-present-2026.firebasestorage.app",
  messagingSenderId: "906557661256",
  appId: "1:906557661256:web:eb4a3f04c129edd1d9b87d"
};

// Optional: set intended recipient emails here only as a convenience.
// The real security must be enforced by Firestore rules and by the email-link sign-in flow.
const FIREBASE_ALLOWED_EMAILS = [];

let _firebaseInitialized = false;

function initFirebaseIfNeeded() {
    if (typeof firebase === 'undefined') return false;
    if (_firebaseInitialized) return true;
    try {
        firebase.initializeApp(FIREBASE_CONFIG);
        _firebaseInitialized = true;
        return true;
    } catch (e) {
        console.error('Firebase init error', e);
        return false;
    }
}

function sendSignInLink(email) {
    if (!initFirebaseIfNeeded()) { showModal('Firebase is not configured.'); return; }
    const actionCodeSettings = {
        // The link will bring the user back to the same page to complete sign-in
        url: window.location.href,
        handleCodeInApp: true
    };
    firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings)
        .then(() => {
            localStorage.setItem('emailForSignIn', email);
            showModal('Sign-in link sent to ' + email + '. Check your email to complete sign-in.');
        })
        .catch(err => {
            console.error(err);
            showModal('Error sending sign-in link: ' + (err && err.message));
        });
}

function handleSignInLinkOnLoad() {
    if (!initFirebaseIfNeeded()) return;
    const auth = firebase.auth();
    if (auth.isSignInWithEmailLink(window.location.href)) {
        let email = localStorage.getItem('emailForSignIn');
        if (!email) {
            email = window.prompt('Please confirm your email to complete sign-in:');
        }
        if (!email) {
            showModal('Email required to complete sign-in.');
            return;
        }
        auth.signInWithEmailLink(email, window.location.href)
            .then((result) => {
                localStorage.removeItem('emailForSignIn');
                showModal('Signed in as ' + (result.user && result.user.email) + '.');
                // After sign-in, fetch keys if appropriate
                fetchAndDisplayKeys();
            })
            .catch(err => {
                console.error(err);
                showModal('Sign-in error: ' + (err && err.message));
            });
    }
}

function fetchAndDisplayKeys() {
    if (!initFirebaseIfNeeded()) { showModal('Firebase not configured.'); return; }
    const auth = firebase.auth();
    const user = auth.currentUser;
    if (!user) {
        showModal('You must sign in to retrieve the keys.');
        return;
    }

    const db = firebase.firestore();
    db.collection('secrets').doc('gameKeys').get()
        .then(doc => {
            if (!doc.exists) {
                showModal('No keys found in Firestore.');
                return;
            }
            const data = doc.data() || {};
            let allowedEmails = [];
            if (Array.isArray(data.allowedEmail)) {
                allowedEmails = data.allowedEmail;
            } else if (typeof data.allowedEmail === 'string') {
                allowedEmails = [data.allowedEmail];
            }
            if (!allowedEmails.length) {
                // If Firestore does not declare allowed email(s), fall back to an optional client-side list.
                allowedEmails = FIREBASE_ALLOWED_EMAILS;
            }
            const userEmail = (user.email || '').toLowerCase();
            const normalizedAllowed = allowedEmails.map(e => (e || '').toLowerCase());
            if (!normalizedAllowed.includes(userEmail)) {
                showModal('Incorrect email. Please try a different one, or message me if the problem persists.');
                return;
            }
            const keys = data.keys || [];
            const keysDiv = document.getElementById('gameKeysDiv');
            if (!keysDiv) return;
            if (!keys.length) {
                keysDiv.innerHTML = '<p style="color:#ffcc00">No keys stored.</p>';
                return;
            }
            keysDiv.innerHTML = `
                <div style="margin-top: 20px; padding: 16px; border: 2px solid #00ff00; border-radius: 6px; background-color: #101814;">
                    <h3 style="color: #00ff00; margin-top: 0;">🎮 Your Game Keys 🎮</h3>
                    <div style="background-color: #0a0a0a; padding: 12px; border-radius: 4px; margin-top: 12px;">
                        ${keys.map(k => `<p style=\"margin:8px 0;color:#00ff00;font-family:'Courier New', monospace;font-size:16px;\">${k}</p>`).join('')}
                    </div>
                    <p style="color:#ffcc00; margin-top:12px; font-size:13px;">If these keys don't work, contact the gift sender.</p>
                </div>
            `;
        })
        .catch(err => {
            console.error(err);
            showModal('Failed to fetch keys: ' + (err && err.message));
        });
}

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
            
            // Show success message and redirect after user closes the message
            showModal('Correct! Next page unlocked.', true, () => {
                window.location.href = nextPage + '.html';
            });
        } else {
            // Final page reached - redirect to index after user closes the message
            showModal('You have completed all puzzles! Now go back to the Home Page to piece them together.', true, () => {
                window.location.href = 'index.html';
            });
        }
        return true;
    } else {
        showModal('Incorrect. Try again.');
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

let modalTimeout = null;
let modalCallback = null;

function showModal(message, autoClose = true, callback = null) {
    let modal = document.getElementById('puzzleModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'puzzleModal';
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.65);
            z-index: 2000;
        `;
        modal.innerHTML = `
            <div style="max-width: 90%; width: 420px; background: #111; border: 1px solid #444; border-radius: 12px; padding: 22px; box-shadow: 0 20px 60px rgba(0,0,0,0.45); font-family: 'Courier New', monospace;">
                <div id="puzzleModalMessage" style="color: #eee; font-size: 16px; line-height: 1.5; white-space: pre-wrap;"></div>
                <button id="puzzleModalClose" style="margin-top: 22px; padding: 10px 18px; background: #333; color: #fff; border: 1px solid #666; border-radius: 6px; cursor: pointer; font-family: 'Courier New', monospace; font-size: 14px;">OK</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#puzzleModalClose').addEventListener('click', closeModal);
    }

    modal.querySelector('#puzzleModalMessage').textContent = message;
    modal.style.display = 'flex';
    modalCallback = callback;

    if (modalTimeout) {
        clearTimeout(modalTimeout);
        modalTimeout = null;
    }

    if (autoClose) {
        modalTimeout = setTimeout(closeModal, 3200);
    }
}

function closeModal() {
    const modal = document.getElementById('puzzleModal');
    if (modal) {
        modal.style.display = 'none';
    }
    if (modalTimeout) {
        clearTimeout(modalTimeout);
        modalTimeout = null;
    }
    if (typeof modalCallback === 'function') {
        const callback = modalCallback;
        modalCallback = null;
        callback();
    }
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
        showModal('This page is locked. Complete the previous puzzles to unlock it.');
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

    // If a Firebase email-link sign-in was used, complete it here
    try { handleSignInLinkOnLoad(); } catch (e) { /* ignore if firebase not present */ }
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
        showModal('🎉 Congratulations! You have solved the puzzle!');
        displayGameKeys();
        return true;
    } else {
        showModal('Not quite right. Keep checking your answers and try again!');
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
    let keysDiv = document.getElementById('gameKeysDiv');
    let resultDiv = document.getElementById('resultDiv');
    if (!resultDiv) {
        const actionArea = document.getElementById('actionArea');
        if (actionArea) {
            actionArea.insertAdjacentHTML('beforeend', '<div id="resultDiv"><div id="gameKeysDiv"></div></div>');
            resultDiv = document.getElementById('resultDiv');
        }
    }
    if (!keysDiv && resultDiv) {
        resultDiv.innerHTML = '<div id="gameKeysDiv"></div>';
        keysDiv = document.getElementById('gameKeysDiv');
    }
    if (!keysDiv) return;

    // If FIREBASE_CONFIG has not been filled in, show message and fallback
    if (!FIREBASE_CONFIG || FIREBASE_CONFIG.apiKey === 'REPLACE_WITH_YOUR_FIREBASE_API_KEY') {
        keysDiv.innerHTML = '<p style="color:#ffcc00">Keys are not available — owner must configure Firebase.</p>';
        return;
    }

    // Ensure Firebase is initialized
    if (!initFirebaseIfNeeded()) {
        keysDiv.innerHTML = '<p style="color:#ff6666">Unable to initialize Firebase. Check console for details.</p>';
        return;
    }

    const auth = firebase.auth();
    const user = auth.currentUser;
    if (user) {
        // Already signed in: fetch from Firestore
        fetchAndDisplayKeys();
        return;
    }

    // Not signed in: show a small form to request sign-in link
    keysDiv.innerHTML = `
        <div style="margin:20px auto 0; max-width:420px; text-align:center;">
            <p style="margin:0 0 12px 0; color:#ddd; font-size:14px; line-height:1.4;">To securely retrieve your keys, enter the email that will receive a sign-in link:</p>
            <input id="signInEmailInput" placeholder="friend@example.com" style="width:100%; padding:10px; background:#111; color:#fff; border:1px solid #444; border-radius:4px; font-family:'Courier New', monospace;" />
            <div style="margin-top:12px; display:flex; gap:8px; justify-content:center;">
                <button id="sendSignInBtn" style="flex:0 0 auto; padding:8px 12px; background:#334; color:#fff; border-radius:4px; border:1px solid #556; cursor:pointer;">Send Sign-in Link</button>
                <button id="cancelSignInBtn" style="flex:0 0 auto; padding:8px 12px; background:#222; color:#fff; border-radius:4px; border:1px solid #444; cursor:pointer;">Cancel</button>
            </div>
            <p style="color:#999; font-size:12px; margin-top:10px;">The sign-in link will be sent to the email you provide. The recipient must open that email to complete sign-in.</p>
        </div>
    `;

    document.getElementById('sendSignInBtn').onclick = () => {
        const email = document.getElementById('signInEmailInput').value.trim();
        if (!email) { showModal('Please enter an email.'); return; }
        sendSignInLink(email);
    };
    document.getElementById('cancelSignInBtn').onclick = () => { keysDiv.innerHTML = ''; };
}
