# 🎮 Tic-Tac-Toe Pro

A modern and interactive Tic-Tac-Toe web application built using HTML, CSS, and JavaScript.

## 🚀 Features

### Game Modes
- Player vs Player
- Player vs Computer

### AI Difficulty Levels
- Easy (Random Moves)
- Medium (Mixed Strategy)
- Hard (Minimax Algorithm)

### Gameplay Features
- Interactive 3x3 Game Board
- Real-Time Turn Display
- Winner Detection
- Draw Detection
- Winning Cell Highlight Animation
- Restart Game Button
- Reset Scoreboard Button

### UI Features
- Modern Neon Glassmorphism Design
- Responsive Layout for Mobile and Desktop
- Smooth Hover Effects
- Animated Winning Cells
- Confetti Celebration Effect
- Local Storage Score Saving

---

## 🛠 Technologies Used

- HTML5
- CSS3
- JavaScript (Vanilla JS)

---

## 📂 Project Structure

```text
tic-tac-toe/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

---

## 🎯 How to Run

### Method 1: Local

1. Download the project files.
2. Place all files in the same folder.
3. Open `index.html` in any modern browser.

### Method 2: GitHub Pages

1. Create a GitHub repository.
2. Upload all project files.
3. Go to:
   Settings → Pages
4. Select:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /root
5. Save changes.
6. Your project will be live within a few minutes.

---

## 🧠 AI Implementation

The Hard difficulty uses the **Minimax Algorithm**.

Minimax evaluates all possible future game states and selects the optimal move, making the computer extremely difficult to defeat.

### Difficulty Logic

| Difficulty | Logic |
|------------|--------|
| Easy | Random Move |
| Medium | 50% Random + 50% Minimax |
| Hard | Full Minimax |

---

## 🏆 Winning Conditions

A player wins by matching three symbols in:

- Any Row
- Any Column
- Any Diagonal

Winning cells are highlighted with an animation.

---

## 💾 Score Storage

Scores are automatically saved using browser Local Storage.

Stored Statistics:
- X Wins
- O Wins
- Draws

Scores remain available even after refreshing the page.

---

## 📱 Responsive Design

The application is optimized for:

- Desktop
- Laptop
- Tablet
- Mobile Devices

---

## 📸 Screenshots

### Home Screen
![Home Screen](screenshots/home.png)

### Gameplay
![Gameplay](screenshots/gameplay.png)

### Winner Detection
![Winner Detection](screenshots/winner.png)

### AI Mode
![AI Mode](screenshots/AImode.png)

---

## 🔮 Future Improvements

- Sound Effects
- Online Multiplayer
- Player Name Customization
- Theme Selection
- Match History
- Tournament Mode

---

## 👨‍💻 Author

Developed by Pavan Reddy

---

## 📜 License

This project is created for educational and internship purposes.
