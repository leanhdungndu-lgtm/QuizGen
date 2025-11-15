# AI Quiz Generator

> Transform PDF/Word documents into interactive multiple-choice quizzes using AI

---

> [!IMPORTANT]
>
> This project is created for educational purposes to help students and teachers generate quizzes quickly from documents.
> 
> **Key Features:**
> - Automatic text extraction from PDF and Word files
> - Smart quiz generation using Gemini AI
> - Modern dark mode interface
> - Completely free, no backend required

---

## Features

### Document Processing
- Support for PDF, DOC, DOCX formats
- Automatic text extraction
- Content preview before generation

### AI-Powered Generation
- Powered by Gemini 2.0 Flash
- Context-aware question generation
- Multiple choice format with 4 options

### Modern Interface
- Dark mode design
- Glassmorphism UI effects
- Smooth animations
- Fully responsive

### User Experience
- Instant answer reveal after selection
- Visual feedback for correct/incorrect answers
- One-time answer selection
- Auto-scroll to new questions

---

## Quick Start

### Requirements
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection for API calls
- No installation needed

### Setup

**Step 1: Get Gemini API Key**

1. Visit https://aistudio.google.com/app/apikey
2. Sign in and create a free API key

**Step 2: Configure**

1. Open `script.js`
2. Replace line 4:
   ```javascript
   const GEMINI_API_KEY = 'YOUR_API_KEY_HERE';
   ```
3. Paste your API key

**Step 3: Run**

- Open `index.html` in your browser
- Or use Live Server (VS Code)
- Or deploy to GitHub Pages/Netlify/Vercel

---

## Usage

**Upload Document**
- Click "Choose File" button
- Select your PDF or Word file
- Wait for text extraction

**Generate Questions**
- Click "Create 1 question" for single question
- Click "Create 5 questions" for batch generation
- Wait 5-10 seconds for AI processing

**Take Quiz**
- Click on your answer choice
- System automatically shows:
  - Correct answer in green
  - Incorrect answer in red (if wrong)
  - Explanation with correct answer

**Reset**
- Click "Upload new file" to start over

---

## Project Structure

```
ai-quiz-generator/
├── index.html          # Main interface
├── style.css          # Dark mode styling
├── script.js          # AI processing logic
└── README.md          # Documentation
```

---

## Configuration

### Change AI Model

Edit `script.js` line 5:

```javascript
const MODEL = "gemini-2.0-flash";  // Default
// Or try:
const MODEL = "gemini-pro";        // More stable
```

### Adjust Text Length

In `generateQuestions` function, line 150:

```javascript
Text: ${extractedText.substring(0, 3000)}
// Increase for more content
Text: ${extractedText.substring(0, 5000)}
```

### Custom Question Count

Edit event listeners:

```javascript
newQuestionBtn.addEventListener('click', () => generateQuestions(3)); // 3 questions
newBatchBtn.addEventListener('click', () => generateQuestions(10));   // 10 questions
```

---

## Troubleshooting

**Error: "Please configure Gemini API Key"**
- Get API key from https://aistudio.google.com/app/apikey
- Update `script.js` line 4
- Refresh page

**Error: "Cannot parse JSON from response"**
- Try generating again
- Or switch to `gemini-pro` model
- Check API key validity

**Error: "File format not supported"**
- Only PDF, DOC, DOCX are supported
- Check file extension
- Convert to supported format

**CORS or API blocked**
- Use Live Server instead of opening file directly
- Deploy to hosting service
- Verify API key is active

---

## API Limits

### Gemini API Free Tier
- 60 requests/minute
- 1,500 requests/day
- Free forever

### Optimization Tips
- Generate in batches of 5 instead of single questions
- Avoid rapid clicking
- Keep documents under 5,000 characters

---

## Deployment

**GitHub Pages**
1. Push code to GitHub repository
2. Go to Settings > Pages
3. Select branch `main` > folder `/root`
4. Access at `https://username.github.io/repo-name`

**Netlify**
1. Drag and drop folder to https://app.netlify.com/drop
2. Or connect GitHub repository
3. Auto-deploy enabled

**Vercel**
```bash
npm i -g vercel
vercel
```

---

## Roadmap

- [x] PDF and Word support
- [x] Gemini AI integration
- [x] Dark mode UI
- [x] Auto answer reveal
- [ ] Export to Excel/PDF
- [ ] Timer mode for exams
- [ ] Score tracking and history
- [ ] Multi-language support
- [ ] Difficulty level customization

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/NewFeature`)
3. Commit changes (`git commit -m 'Add NewFeature'`)
4. Push to branch (`git push origin feature/NewFeature`)
5. Open Pull Request

---

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## Credits

- **Gemini AI** - Google's AI model
- **PDF.js** - Mozilla's PDF reader
- **Mammoth.js** - Word document converter

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-quiz-generator/issues)
- **Email**: your.email@example.com

---

> This project is completely free and open-source. Created for the learning community.

**Happy Learning!**