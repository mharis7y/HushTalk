# Privacy Policy — HushTalk

**Effective date:** 2026-04-22
**App name:** HushTalk
**Package name:** com.mharis7y.hushtalk
**Developer:** Mharis7y
**Contact:** mharis7y@gmail.com

This Privacy Policy explains what information HushTalk ("we", "our", "the app") collects, how we use it, who we share it with, and the choices you have. By using HushTalk you agree to this policy.

---

## 1. Information We Collect

### 1.1 Information you provide
When you create an account, we collect:
- **Email address** — used to sign in and recover your account.
- **Username (display name)** — shown to other users you chat with.
- **Phone number** — stored on your profile for account identification.
- **Password** — handled by Firebase Authentication; we never see or store your plaintext password.

### 1.2 Content you create
- **Chat messages** sent to other users through HushTalk are stored in our database so the recipient can read them.
- **Images and videos** you choose to upload (including media used in the steganography Vault feature) are stored in our media bucket.

### 1.3 Information processed on your device (not collected by us)
- **The secret message you hide inside an image or video** is embedded locally on your device using steganography. The hidden plaintext message itself is never transmitted to our servers — only the final stego-image or stego-video (which looks like an ordinary photo/video) is uploaded if you choose to share it.
- **Media you only extract from or preview** is processed on-device and is not uploaded unless you explicitly save or share it.

### 1.4 Permissions we request
- `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_VISUAL_USER_SELECTED` (Android 13+) — so you can pick photos and videos to use with the steganography feature.
- `READ_EXTERNAL_STORAGE` (Android 12 and below), `WRITE_EXTERNAL_STORAGE` (Android 9 and below) — same purpose, for older devices.
- `INTERNET` — to sign in, send/receive messages, and upload media you choose to save.
- `VIBRATE` — for haptic feedback in the UI.

We do **not** request access to your microphone, contacts, location, camera, or SMS.

### 1.5 Automatically collected
- **Crash and diagnostic data** may be collected by Firebase and Expo services to help us keep the app stable. This does not include personal content.

---

## 2. How We Use Your Information

We use the information we collect to:
- Create and authenticate your account.
- Deliver chat messages between users.
- Store your uploaded media so you can access it across sessions.
- Maintain, secure, and improve the app.
- Respond to your support requests.

We do **not** sell your personal information. We do **not** use your content for advertising or to train machine-learning models.

---

## 3. Third-Party Services

HushTalk relies on the following third-party processors:

| Service | Purpose | Data handled |
|---|---|---|
| **Google Firebase Authentication** | User sign-in and account management | Email, password hash, UID |
| **Google Cloud Firestore** | Storing user profiles and chat messages | Username, email, phone, messages |
| **Appwrite Cloud (Singapore region)** | Storing uploaded media | Images, videos, file metadata |
| **Expo** | App delivery and crash diagnostics | Anonymous device/crash data |

Each of these providers has its own privacy policy. Data may be processed on servers located outside your country (United States, Singapore, and other regions depending on the provider).

---

## 4. Data Retention

- Your account data and chat history are retained until you delete your account.
- Uploaded media stays in our storage until you delete it from the app or delete your account.
- Backups may be retained by our providers for a short rolling window (typically up to 30 days) for disaster recovery.

---

## 5. Your Rights and Choices

### 5.1 In-app account deletion
You can permanently delete your account at any time directly inside the app:
**Profile → Delete Account** → enter your password to confirm.
This deletes your user profile, chat records, and removes your Firebase Auth credentials.

### 5.2 Web-based deletion request
If you cannot access the app, email us at **mharis7y@gmail.com** from the address associated with your account. We will delete your account and confirm by reply within 30 days.

### 5.3 Access and correction
You may view and edit your username and password from the Profile screen. For other data access or correction requests, contact us at the email above.

---

## 6. Children's Privacy

HushTalk is not directed at children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has created an account, contact us and we will delete the account.

---

## 7. Security

- Passwords are handled by Firebase Authentication and are never visible to us.
- Data in transit uses HTTPS/TLS.
- Backend access is restricted by Firebase Security Rules and Appwrite permission scopes.
- Despite our safeguards, no method of transmission or storage is 100% secure.

---

## 8. Changes to This Policy

We may update this policy from time to time. Material changes will be announced in the app or via email. The "Effective date" above will reflect the latest revision.

---

## 9. Contact

Questions, concerns, or deletion requests:
**mharis7y@gmail.com**
