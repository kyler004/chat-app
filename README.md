# Relay 🚀

**Relay** is a premium, real-time chat application designed for high-end digital communication. Built with a modern full-stack architecture, it combines sophisticated aesthetics with powerful real-time capabilities.

![Relay Premium UI](file:///home/kyler/.gemini/antigravity/brain/dfcb07d4-ba47-4d0b-8cb1-7ca9bc4fad68/chat_layout_messages_1773166806788.png)

## ✨ Features

-   **Real-time Messaging**: Instant communication powered by Socket.io.
-   **Premium Glassmorphic UI**: High-end design with animated mesh gradients and fluid interactions.
-   **Intelligent Search**: Real-time message filtering with dynamic keyword highlighting.
-   **Personalized Profiles**: Manage your identity with custom usernames and avatars.
-   **Modern Auth**: Secure JWT-based authentication with sleek transitions.
-   **Dynamic Workspaces**: Efficient multi-channel navigation.
-   **Typing Presence**: Real-time feedback showing when colleagues are active.

## 🛠 Tech Stack

### Frontend
-   **React 19** (Vite context)
-   **Tailwind CSS 4** (Modern styling)
-   **Framer Motion** (Premium animations)
-   **Lucide React** (Vector iconography)
-   **Axios** (API communication)

### Backend
-   **Node.js & Express**
-   **Socket.io** (WebSockets)
-   **Prisma ORM** (Database management)
-   **PostgreSQL** (Primary persistence)
-   **Redis** (Infrastructure health)
-   **JWT & Bcrypt** (Security)

---

## 🚀 Getting Started

### 📦 Quick Start with Docker (Recommended)
The easiest way to get Relay up and running is using Docker:

1.  **Clone the Repository**
2.  **Launch Containers**:
    ```bash
    docker-compose up --build
    ```
3.  **Access the App**: Navigate to `http://localhost:3000` in your browser.

---

### 🔧 Manual Local Setup

#### 1. Backend Configuration
1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up your environment variables in `.env` (refer to `docker-compose.yml` for required keys).
4.  Run database migrations:
    ```bash
    npx prisma migrate dev
    ```
5.  Start the development server:
    ```bash
    npm run dev
    ```

#### 2. Frontend Configuration
1.  Navigate to the `frontend` directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development server:
    ```bash
    npm run dev
    ```
4.  Relay will be available at `http://localhost:5173`.

---

## 🏗 Project Structure

```text
chat-app/
├── backend/            # Express server, Prisma models, Socket handlers
├── frontend/           # React application, Tailwind styles, API hooks
├── docker-compose.yml  # Full orchestrated environment
└── README.md           # You are here
```

## 📜 License
This project is licensed under the ISC License.
