<p align="center">
  <img src="assets/icon.png" alt="SurfBuddy Icon" />
</p>

<h1 align="center">SurfBuddy</h1>

A browser extension for summarizing search results with a local Ollama setup.

## Features

- Summarizes search results with a local Ollama setup.
- Provides a chat interface for interacting with the Ollama model.
- Allows users to configure the models.

## Getting Started

First, make sure [Ollama](https://ollama.com/) is configured and running locally.

Then run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

- Chrome: Open `chrome://extensions/`, enable Developer mode, load unpacked extension
- Firefox: Open `about:debugging`, click "This Firefox", load temporary add-on


