# ZennSMM | Premium Social Media Growth

The most reliable SMM platform to boost your followers, likes, and engagement in seconds.

## Netlify Deployment Checklist

To deploy this application to Netlify and ensure Google Authentication works correctly, follow these steps:

### 1. Firebase Console Settings
Go to [Firebase Console](https://console.firebase.google.com/) and navigate to your project.

- **Authentication > Settings > Authorized Domains**:
  - Add `localhost`
  - Add your Netlify URL (e.g., `zennsmm.netlify.app`)
  - Add any custom domains you plan to use.
- **Authentication > Sign-in method**:
  - Ensure **Google** and **Email/Password** are enabled.
  - Set the **Project support email** in the Google settings.

### 2. Netlify Environment Variables
Set the following variables in your Netlify site settings (**Site settings > Build & deploy > Environment > Environment variables**):

| Variable | Description |
|----------|-------------|
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `FIREBASE_CLIENT_EMAIL` | The client email from your Service Account JSON |
| `FIREBASE_PRIVATE_KEY` | The private key from your Service Account JSON (ensure it includes `\n` characters) |
| `NEXT_PUBLIC_FIREBASE_CONFIG` | (Optional) If you want to override the default config. |

### 3. Deploy
1. Connect your repository to Netlify.
2. Netlify will automatically detect the `netlify.toml` file.
3. Build command: `npm run build`
4. Publish directory: `.next`

## Local Development
Run `npm run dev` to start the development server.
