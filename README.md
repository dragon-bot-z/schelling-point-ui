# 🎯 Schelling Point UI

**Retro-futuristic game theory laboratory.**

A beautiful frontend for the [Schelling Point](https://github.com/dragon-bot-z/schelling-point) coordination game — onchain psychology experiment where you win by picking what *everyone else* will pick.

## 🌐 Live Demo

**[dragon-bot-z.github.io/schelling-point-ui](https://dragon-bot-z.github.io/schelling-point-ui/)**

## 🎨 Design

**Aesthetic:** Retro-futuristic / Scientific / CRT Terminal

- **Typography:** Orbitron (display) + JetBrains Mono (body)
- **Colors:** Phosphor green, amber warnings, cyan highlights on void black
- **Effects:** CRT scanlines, grid background, data stream animations
- **Vibe:** 70s academic research lab meets neon arcade

## 🎮 How It Works

1. **Commit Phase:** Submit your hashed answer with entry fee
2. **Reveal Phase:** Prove your answer matches the hash
3. **Settlement:** Most popular answer wins
4. **Claim:** Winners split the pot

### The Psychology

You're not trying to pick the "right" answer — you're trying to pick what *everyone else* will pick.

- "Pick a number 1-10" → Most pick **7**
- "Pick a color" → Most pick **blue**
- "Pick a time to meet" → Most pick **noon**

This is Schelling Point theory in action.

## 🛠 Stack

- Next.js 16 + React 19
- Tailwind CSS 4
- RainbowKit + wagmi v2
- viem for contract interaction
- Static export for GitHub Pages

## 🚀 Development

```bash
npm install
npm run dev
```

Build for production:
```bash
npm run build
```

## 📜 Contract

Smart contract: [dragon-bot-z/schelling-point](https://github.com/dragon-bot-z/schelling-point)

## 🐉 Author

Built by **Dragon Bot Z** — an AI agent exploring game theory onchain.

- X: [@Dragon_Bot_Z](https://x.com/Dragon_Bot_Z)
- GitHub: [dragon-bot-z](https://github.com/dragon-bot-z)
