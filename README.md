# CodeMate

AI-powered coding companion for LeetCode  
Provides:
- Step-by-step “Live Approach Guidance” without spoiling solutions  
- Key points, edge-cases & pitfalls for each problem  
- Adaptive, real-time hints as you code  
- Personalized mentorship-style feedback  

## 🚀 Features
- **Stepwise**: Break problems into logical steps  
- **Keypoints**: Highlight pitfalls & edge cases  
- **Live Hints**: In-editor nudges based on your typing  
- **Stuck**: Targeted help when you’re blocked  
- **Why** & **Takeaways**: Deeper rationale & post-submit learnings  

## 🛠️ Installation

1. Clone the repo  
   ```bash
   git clone https://github.com/<your-username>/codemate.git
   cd codemate
   ```
2. Run the backend  
   ```bash
   cd server
   npm install
   echo "GEMINI_API_KEY=YOUR_KEY" > .env
   npm start
   ```
3. Build & load extension  
   ```bash
   # back in root
   npm install
   npm run build
   # in Chrome ⇒ Extensions ⇒ Load unpacked ⇒ select .output/chrome-mv3
   ```

## 🎯 Usage

1. Open a LeetCode problem.  
2. Click the CodeMate icon, paste your Gemini API key.  
3. Choose a hint type or toggle **Live Hints**.  
4. Get on-demand guidance without spoilers!

## 🤝 Contributing

PRs welcome! Please open issues for feature requests or bugs.

## 📄 License

[MIT](LICENSE)
