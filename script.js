// Configuration
const GEMINI_API_KEY = AQ.Ab8RN6JM9xQbiHjQteYqrv8gNNJj8zpf2Ubjc_EIHBhp8Gtk0Q;
const MODEL = "gemini-2.0-flash";

// Global variables
let extractedText = '';
let questionCount = 0;

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// DOM elements
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const pdfPreview = document.getElementById('pdfPreview');
const controls = document.getElementById('controls');
const quizContainer = document.getElementById('quizContainer');
const newQuestionBtn = document.getElementById('newQuestion');
const newBatchBtn = document.getElementById('newBatch');
const resetBtn = document.getElementById('reset');

// File upload handler
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileName.textContent = `Processing: ${file.name}`;
    fileName.style.color = '#667eea';

    try {
        if (file.type === 'application/pdf') {
            extractedText = await extractPDFText(file);
        } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
            extractedText = await extractWordText(file);
        } else {
            throw new Error('Unsupported file format');
        }

        displayPreview(file.name);
        fileName.textContent = `✓ Loaded: ${file.name}`;
        fileName.style.color = '#2ecc71';
    } catch (error) {
        fileName.textContent = `✗ Error: ${error.message}`;
        fileName.style.color = '#e74c3c';
        console.error('File processing error:', error);
    }
});

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

async function extractWordText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
}

function displayPreview(filename) {
    document.getElementById('previewFileName').textContent = filename;
    document.getElementById('previewContent').textContent = 
        extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : '');
    document.getElementById('totalChars').textContent = extractedText.length.toLocaleString();
    pdfPreview.classList.add('active');
    controls.classList.add('active');
}

async function generateQuestions(count = 1) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        showError('Please configure Gemini API Key in script.js');
        return;
    }

    if (!extractedText) {
        showError('Please upload a file first');
        return;
    }

    newQuestionBtn.disabled = true;
    newBatchBtn.disabled = true;

    const loadingDiv = showLoading(`Generating ${count} question${count > 1 ? 's' : ''}`);

    try {
        const prompt = `Based on the following text, create ${count} multiple choice questions in Vietnamese. Each question should have 4 options (A, B, C, D) with only 1 correct answer.

Text: ${extractedText.substring(0, 3000)}

Return the result as a JSON array in this format:
[
  {
    "question": "Question text",
    "answers": {
      "A": "Answer A",
      "B": "Answer B",
      "C": "Answer C",
      "D": "Answer D"
    },
    "correct": "A"
  }
]

Return only JSON, no additional text.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            }
        );

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'API call failed');
        }

        const generatedText = data.candidates[0].content.parts[0].text;
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        
        if (!jsonMatch) {
            throw new Error('Cannot parse JSON from response');
        }

        const questions = JSON.parse(jsonMatch[0]);
        loadingDiv.remove();

        questions.forEach(q => displayQuestion(q));

    } catch (error) {
        loadingDiv.remove();
        showError(`Error: ${error.message}`);
        console.error('Generation error:', error);
    } finally {
        newQuestionBtn.disabled = false;
        newBatchBtn.disabled = false;
    }
}

function displayQuestion(questionData) {
    questionCount++;
    const card = document.createElement('div');
    card.className = 'question-card';
    
    let answersHTML = '';
    for (const [key, value] of Object.entries(questionData.answers)) {
        answersHTML += `
            <div class="answer-option" data-answer="${key}">
                <strong>${key}.</strong> ${value}
            </div>
        `;
    }

    card.innerHTML = `
        <h3>Question ${questionCount}: ${questionData.question}</h3>
        <div class="answers">
            ${answersHTML}
        </div>
        <div class="answer-explanation">✓ Correct answer: <strong>${questionData.correct}</strong> - ${questionData.answers[questionData.correct]}</div>
    `;

    const options = card.querySelectorAll('.answer-option');
    const explanation = card.querySelector('.answer-explanation');
    let answered = false;

    options.forEach(option => {
        option.addEventListener('click', () => {
            if (answered) return;

            answered = true;
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            options.forEach(opt => opt.classList.add('answered'));
            
            options.forEach(opt => {
                if (opt.dataset.answer === questionData.correct) {
                    opt.classList.add('correct');
                } else if (opt.classList.contains('selected')) {
                    opt.classList.add('incorrect');
                }
            });
            
            explanation.classList.add('visible');
            setTimeout(() => {
                explanation.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        });
    });

    quizContainer.appendChild(card);
    setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function showLoading(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = message;
    quizContainer.appendChild(loadingDiv);
    
    setTimeout(() => {
        loadingDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    
    return loadingDiv;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    quizContainer.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function resetApp() {
    extractedText = '';
    questionCount = 0;
    quizContainer.innerHTML = '';
    pdfPreview.classList.remove('active');
    controls.classList.remove('active');
    fileInput.value = '';
    fileName.textContent = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event listeners
newQuestionBtn.addEventListener('click', () => generateQuestions(1));
newBatchBtn.addEventListener('click', () => generateQuestions(5));
resetBtn.addEventListener('click', resetApp);

// Initialize
console.log('AI Quiz Generator initialized');
console.log('API Key configured:', GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE');
document.documentElement.style.scrollBehavior = 'smooth';
