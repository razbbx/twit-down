# TwitDown

A sleek, modern Twitter/X video downloader with a glassmorphism dark theme. Paste any Twitter video link and download in multiple quality options.

![TwitDown](https://img.shields.io/badge/TwitDown-Video%20Downloader-00d4ff?style=for-the-badge)

## ✨ Features

- 🎬 **Download HD Videos** — Support for 1080p, 720p, 480p, 360p
- ⚡ **Instant Fetching** — Uses fxtwitter API for fast, reliable video extraction
- 🎨 **Modern UI** — Dark glassmorphism design with neon gradients
- 📋 **One-Click Paste** — Paste button for quick link input
- 📱 **Responsive** — Works on desktop and mobile browsers
- 🔒 **No Backend Required** — Runs entirely in the browser

## 🚀 Live Demo

**[twit-down.vercel.app](https://twit-down.vercel.app)**

## 📸 Preview

| Home | Video Result |
|------|--------------|
| Dark theme with glowing search input | Quality selection with one-click download |

## 🛠️ Tech Stack

- **React 19** — UI framework
- **Vite** — Build tool
- **Lucide React** — Icon library
- **Outfit** — Typography (Google Fonts)
- **fxtwitter API** — Video metadata extraction

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/razbbx/twit-down.git

# Navigate to project
cd twit-down

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🏗️ Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
twit-down/
├── src/
│   ├── components/
│   │   ├── SearchBar.jsx      # URL input with paste button
│   │   ├── SearchBar.css
│   │   ├── VideoResult.jsx    # Video card with quality list
│   │   └── VideoResult.css
│   ├── utils/
│   │   └── api.js             # Tweet ID extraction & API calls
│   ├── App.jsx                # Main application
│   ├── App.css                # App layout & animations
│   ├── index.css              # Design system & variables
│   └── main.jsx               # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## 🎯 How It Works

1. **Paste URL** — User pastes a Twitter/X video link
2. **Extract Tweet ID** — App parses the URL to get the tweet ID
3. **Fetch Metadata** — Calls fxtwitter API to get video variants
4. **Display Options** — Shows all available quality options
5. **Download** — Opens selected quality video in new tab for saving

## 🔧 API

Uses the free [fxtwitter](https://github.com/FixTweet/FxTwitter) API:

```
GET https://api.fxtwitter.com/status/{tweet_id}
```

Returns video variants with URLs, resolutions, and bitrates.

## 📄 License

MIT License — feel free to use and modify.

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

Made with ❤️ by [@razbbx](https://github.com/razbbx)
