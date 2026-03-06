# 🕵️ Fake News Detective

This project is a decentralized fact-checking game built on GenLayer, demonstrating real-world AI consensus applications rather than surface-level demos. The system leverages GenLayer's execution and validation model as the core computational layer for headline verification, game state management, and score resolution. By using GenLayer's decentralized AI consensus for fact-checking, the game achieves trust-minimized, deterministic verification of player guesses, ensuring that every round's outcome is validated through a distributed network of AI validators rather than a single point of failure. The architecture emphasizes infrastructure-first design, showing how GenLayer enables composable, verifiable applications where game logic, scoring, and leaderboard state are all managed on-chain through Intelligent Contracts.

## 🎮 How It Works

1. **Start a Round** - Get a random headline (real or fake)
2. **Make Your Guess** - Is it REAL or FAKE?
3. **AI Judges** - GenLayer AI consensus fact-checks your answer
4. **Score Points** - Get +1 if you're right, -1 if you're wrong
5. **Climb the Leaderboard** - Compete with other players

## 🚀 Features

- **AI-Powered Fact-Checking** - Uses GenLayer's decentralized AI consensus to verify headlines
- **Global Leaderboard** - See how you stack up against other players
- **Custom Rooms** - Create private rooms with your own headlines (AI or manual mode)
- **Nicknames** - Set your nickname to appear on the leaderboard
- **Real-Time Stats** - Track your wins, losses, and total games played

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Blockchain**: GenLayer (Python Intelligent Contracts)
- **Wallet**: MetaMask integration
- **Deployment**: Vercel

## 📦 Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- MetaMask browser extension
- GenLayer Studio account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Web3Donda/FakeNews.git
cd FakeNews
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Add your variables:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 Game Modes

### Global Game
Play with headlines from the built-in database. One headline at a time, AI judges your answer.

### Custom Rooms
Create your own game rooms:
- **AI Mode**: Headlines are fact-checked by GenLayer AI
- **Manual Mode**: You set the answers yourself
- Share room codes with friends
- Track scores per room

## 🎨 How to Play

1. **Connect Your Wallet** - MetaMask required
2. **Switch to GenLayer Network** - Auto-prompted on first connect
3. **Start Playing** - Click "New Round" or join a room
4. **Read Carefully** - Headlines can be tricky!
5. **Make Your Guess** - REAL or FAKE?
6. **See Results** - AI consensus reveals the truth

## 📊 Scoring

- **Correct Guess**: +1 point
- **Wrong Guess**: -1 point
- **Score**: Wins - Losses
- **Leaderboard**: Ranked by score

## 🔗 Links

- **Live Demo**: [https://fakenews-bice.vercel.app](https://fakenews-bice.vercel.app)
- **GenLayer**: [https://genlayer.com](https://genlayer.com)

## 🤝 Contributing

Feel free to fork, improve, and submit PRs! This is a great example of GenLayer AI consensus in action.

## 📝 License

MIT License - feel free to use this project as a reference for your own GenLayer apps!

---

**Built with ❤️ using GenLayer AI Consensus**
