# IT Help Centre — monday.com Widget

A clean, simple IT help desk widget that lives inside monday.com. Built with React, Vite, and Netlify Functions.

## Features

- Auto-detects the logged-in monday.com user — no manual login needed
- Submit IT requests with category, description and urgency level
- Staff can track their own requests and see live status updates
- Real-time status pulled directly from your monday.com board
- API token stored as an environment variable, never exposed in code

## Project Structure

```
monday-help-widget/
├── netlify/
│   └── functions/
│       └── monday-proxy.js   # Secure serverless proxy to monday.com API
├── src/
│   ├── monday-helpdesk.jsx   # Main app — all UI and logic lives here
│   └── main.jsx              # App entry point
├── netlify.toml              # Netlify build configuration
├── package.json              # Project dependencies
└── vite.config.js            # Vite configuration
```

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/monday-help-widget.git
cd monday-help-widget
npm install
```

### 2. Set up your monday.com board
You need a monday.com board with these columns:

| Column Title | Column Type | Column ID |
|---|---|---|
| Submitter | People | multiple_person_mm2xtr55 |
| What type of IT help do you need? | Status | single_selectxtrjfvr |
| Please describe the issue or request | Long Text | long_textf6c35riz |
| How urgent is this request? | Status | single_selectzqk5m33 |
| Status | Status | color_mm2xvd7 |

If your column IDs are different, update the COL object at the top of src/monday-helpdesk.jsx.

### 3. Get your monday.com API token
1. Go to monday.com and click your profile picture
2. Click Developers
3. Click My Access Tokens, then Show, and copy the token

### 4. Deploy to Netlify
1. Push this repository to GitHub
2. Go to netlify.com, click Add new project, then Import from GitHub
3. Set build settings:
   - Build command: npm run build
   - Publish directory: dist
4. Go to Site configuration, then Environment variables, and add:
   - Key: MONDAY_API_TOKEN
   - Value: your monday.com API token
5. Trigger a new deploy

### 5. Add to monday.com
1. Go to monday.com, click your profile picture, then Developers
2. Open your app, click Features, then Add Feature, then Board View
3. Paste your Netlify URL
4. Click Promote to live
5. Go to any board, click the + button, find your app and add it

## Making Changes

Edit src/monday-helpdesk.jsx for any UI or logic changes, then run:

```bash
git add .
git commit -m "describe your change"
git push
```

Netlify will automatically rebuild and deploy.

## Configuration

At the top of src/monday-helpdesk.jsx you can change:

```js
const BOARD_ID = "5095581355"; // Your monday.com board ID

const HELP_TYPES = [...]; // The help categories shown to staff

const URGENCY_LEVELS = [...]; // The urgency options

const STATUS_MAP = {...}; // Status labels and colours from your board
```

## Security

The monday.com API token is never stored in the code. It lives as an environment variable in Netlify and is only used server-side inside the monday-proxy function. This means it is never exposed to the browser or visible in your GitHub repository.

## Built With

- React — UI framework
- Vite — Build tool
- Netlify Functions — Serverless backend
- monday.com API — Board data

## License

Free to use and modify for your organisation.
