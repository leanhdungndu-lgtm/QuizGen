// ============================================
// CONFIGURATION - Thay đổi API Key tại đây
// ============================================
const GEMINI_API_KEY = 'AIzaSyCbWfOla29VASM0_jlfPIhUCqeCyaZA5jU';
const MODEL = "gemini-2.0-flash";
// Lấy API key miễn phí tại: https://aistudio.google.com/app/apikey

// ============================================
// GLOBAL VARIABLES
// ============================================
let extractedText = '';
let questionCount = 0;

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ============================================
// DOM ELEMENTS
// ============================================
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const pdfPreview = document.getElementById('pdfPreview');
const controls = document.getElementById('controls');
const quizContainer = document.getElementById('quizContainer');
const newQuestionBtn = document.getElementById('newQuestion');
const newBatchBtn = document.getElementById('newBatch');
const resetBtn = document.getElementById('reset');

// ============================================
// FILE UPLOAD HANDLER
// ============================================
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileName.textContent = `Đang xử lý: ${file.name}`;
    fileName.style.color = '#667eea';

    try {
        if (file.type === 'application/pdf') {
            extractedText = await extractPDFText(file);
        } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
            extractedText = await extractWordText(file);
        } else {
            throw new Error('Định dạng file không được hỗ trợ');
        }

        displayPreview(file.name);
        fileName.textContent = `✅ Đã tải: ${file.name}`;
        fileName.style.color = '#2ecc71';
    } catch (error) {
        fileName.textContent = `❌ Lỗi: ${error.message}`;
        fileName.style.color = '#e74c3c';
        console.error('File processing error:', error);
    }
});

// ============================================
// TEXT EXTRACTION FUNCTIONS
// ============================================

/**
 * Extract text from PDF file
 * @param {File} file - PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractPDFText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        text += pageText + '\n';
    }

    return text.trim();
}

/**
 * Extract text from Word document
 * @param {File} file - Word file
 * @returns {Promise<string>} - Extracted text
 */
async function extractWordText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
}

// ============================================
// PREVIEW DISPLAY
// ============================================

/**
 * Display file preview
 * @param {string} filename - Name of uploaded file
 */
function displayPreview(filename) {
    document.getElementById('previewFileName').textContent = filename;
    document.getElementById('previewContent').textContent = 
        extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : '');
    document.getElementById('totalChars').textContent = extractedText.length.toLocaleString();
    pdfPreview.classList.add('active');
    controls.classList.add('active');
}

// ============================================
// GEMINI API - QUESTION GENERATION
// ============================================

/**
 * Generate quiz questions using Gemini API
 * @param {number} count - Number of questions to generate
 */
async function generateQuestions(count = 1) {
    // Validate API key
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        showError('Vui lòng cấu hình Gemini API Key trong file script.js!');
        return;
    }

    // Validate extracted text
    if (!extractedText) {
        showError('Vui lòng upload file trước!');
        return;
    }

    // Disable buttons during generation
    newQuestionBtn.disabled = true;
    newBatchBtn.disabled = true;

    // Show loading indicator
    const loadingDiv = showLoading(`Đang tạo ${count} câu hỏi`);

    try {
        // Prepare prompt for Gemini
        const prompt = `Dựa trên văn bản sau, hãy tạo ${count} câu hỏi trắc nghiệm bằng tiếng Việt. Mỗi câu hỏi có 4 đáp án (A, B, C, D) và chỉ 1 đáp án đúng.

Văn bản: ${extractedText.substring(0, 3000)}

Trả về kết quả dưới dạng JSON array với format:
[
  {
    "question": "Câu hỏi",
    "answers": {
      "A": "Đáp án A",
      "B": "Đáp án B",
      "C": "Đáp án C",
      "D": "Đáp án D"
    },
    "correct": "A"
  }
]

Chỉ trả về JSON, không thêm text nào khác.`;

        // Call Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            }
        );

        const data = await response.json();
        
        // Handle API errors
        if (!response.ok) {
            throw new Error(data.error?.message || 'Lỗi khi gọi API');
        }

        // Extract generated text
        const generatedText = data.candidates[0].content.parts[0].text;
        
        // Parse JSON from response
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        
        if (!jsonMatch) {
            throw new Error('Không thể parse JSON từ response');
        }

        const questions = JSON.parse(jsonMatch[0]);
        
        // Remove loading indicator
        loadingDiv.remove();

        // Display generated questions
        questions.forEach(q => {
            displayQuestion(q);
        });

    } catch (error) {
        loadingDiv.remove();
        showError(`Lỗi: ${error.message}`);
        console.error('Generation error:', error);
    } finally {
        // Re-enable buttons
        newQuestionBtn.disabled = false;
        newBatchBtn.disabled = false;
    }
}

// ============================================
// QUESTION DISPLAY
// ============================================

/**
 * Display a question card
 * @param {Object} questionData - Question data object
 */
function displayQuestion(questionData) {
    questionCount++;
    const card = document.createElement('div');
    card.className = 'question-card';
    
    // Build answers HTML
    let answersHTML = '';
    for (const [key, value] of Object.entries(questionData.answers)) {
        answersHTML += `
            <div class="answer-option" data-answer="${key}">
                <strong>${key}.</strong> ${value}
            </div>
        `;
    }

    // Build card HTML
    card.innerHTML = `
        <h3>Câu ${questionCount}: ${questionData.question}</h3>
        <div class="answers">
            ${answersHTML}
        </div>
        <div class="answer-explanation">✅ Đáp án đúng: <strong>${questionData.correct}</strong> - ${questionData.answers[questionData.correct]}</div>
    `;

    // Get answer options and explanation
    const options = card.querySelectorAll('.answer-option');
    const explanation = card.querySelector('.answer-explanation');
    let answered = false;

    // Add answer selection functionality
    options.forEach(option => {
        option.addEventListener('click', () => {
            // Prevent changing answer after first selection
            if (answered) return;

            // Mark as answered
            answered = true;
            
            // Remove any previous selection
            options.forEach(opt => opt.classList.remove('selected'));
            
            // Mark selected answer
            option.classList.add('selected');
            
            // Mark all options as answered (disable further clicks)
            options.forEach(opt => opt.classList.add('answered'));
            
            // Show correct/incorrect styling
            options.forEach(opt => {
                if (opt.dataset.answer === questionData.correct) {
                    opt.classList.add('correct');
                } else if (opt.classList.contains('selected')) {
                    opt.classList.add('incorrect');
                }
            });
            
            // Show explanation
            explanation.classList.add('visible');
            
            // Smooth scroll to explanation
            setTimeout(() => {
                explanation.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        });
    });

    // Add card to container
    quizContainer.appendChild(card);
    
    // Smooth scroll to new question
    setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

/**
 * Show loading indicator
 * @param {string} message - Loading message
 * @returns {HTMLElement} - Loading div element
 */
function showLoading(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = message;
    quizContainer.appendChild(loadingDiv);
    
    // Smooth scroll to loading
    setTimeout(() => {
        loadingDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    
    return loadingDiv;
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    quizContainer.appendChild(errorDiv);
    
    // Auto remove error after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

/**
 * Reset application state
 */
function resetApp() {
    extractedText = '';
    questionCount = 0;
    quizContainer.innerHTML = '';
    pdfPreview.classList.remove('active');
    controls.classList.remove('active');
    fileInput.value = '';
    fileName.textContent = '';
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// EVENT LISTENERS
// ============================================
newQuestionBtn.addEventListener('click', () => generateQuestions(1));
newBatchBtn.addEventListener('click', () => generateQuestions(5));
resetBtn.addEventListener('click', resetApp);

// ============================================
// INITIALIZATION
// ============================================
console.log('🚀 AI Quiz Generator initialized');
console.log('✅ API Key configured:', GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE');

// Add smooth scrolling to page
document.documentElement.style.scrollBehavior = 'smooth';