# 🎓 ABU Tutors Connect

An intelligent, full-stack tutoring platform designed to seamlessly connect students with qualified tutors at Ahmadu Bello University (ABU). The ecosystem features an advanced AI tutor matching algorithm, real-time chat, wallet functionality, and session scheduling across both Web and Mobile platforms.

## 🌟 Key Features

- **🤖 AI Tutor Matching:** Intelligently recommends the best tutors based on student needs, budget, and academic goals.
- **📱 Cross-Platform Accessibility:** Fully-functional Next.js web application and an Expo React Native mobile app.
- **💬 Real-Time Messaging:** Live chat system between tutors and students using WebSockets (Socket.io).
- **📅 Session Booking & Availability:** Integrated scheduling matrix for tutors to set availability and students to book slots.
- **💳 Wallet & Payments:** Secure financial transactions using Paystack integration for wallet funding and tutor withdrawals.
- **🛡️ Secure Authentication:** Role-based access control (Admin, Tutor, Student) with encrypted credentials.

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js, TypeScript, Socket.io
- **Database:** MongoDB (Mongoose)
- **Web App:** Next.js (React), Tailwind CSS, TypeScript
- **Mobile App:** Expo, React Native, TypeScript
- **Storage:** Cloudinary (Profile Pictures, Documents)
- **Payment Gateway:** Paystack

---

## 🚀 Getting Started

Follow these steps to run the ABU Tutors Connect platform locally.

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance (local or Atlas)
- Accounts for [Cloudinary](https://cloudinary.com/) and [Paystack](https://paystack.com/) for API keys.

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory and configure the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PAYSTACK_SECRET_KEY=your_paystack_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### 2. Web Application Setup
1. Open a new terminal and navigate to the web app:
   ```bash
   cd web-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` or `.env` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

### 3. Mobile Application Setup
1. Open a new terminal and navigate to the mobile app:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file for your backend URL (usually pointing to your local IP address since mobile emulators/devices need to reach your machine):
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP_ADDRESS:5000/api
   ```
4. Run the Expo development server:
   ```bash
   npx expo start
   ```

## 📂 Project Structure

- `/backend` - Holds all API controllers, routes, models, and WebSocket configurations.
- `/web-app` - The student and tutor web dashboard built with Next.js App Router.
- `/mobile` - The Expo-based mobile application matching the web capabilities.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
