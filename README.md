# Relay

Relay is a premium, real-time chat application designed for high-end digital communication. Built with a modern full-stack architecture, it combines sophisticated aesthetics with powerful real-time capabilities.

![Relay Screenshot 1](image.png)
![Relay Screenshot 2](image-1.png)

## Features

- **Real-time Messaging**: Instant communication powered by Socket.io, including full support for Direct Messages (DMs) and group Channels.
- **Message Management**: Users can select and delete their own messages with changes reflecting instantly across all connected clients.
- **Advanced Room Moderation**: Create forums, manage members (add/remove), and assign administrative roles.
- **Interactive Metadata**: Dynamic room and DM descriptions that synchronize for all participants in real-time without requiring a page refresh.
- **Dynamic Themes**: A global theme context allows users to customize accent colors, toggle dark mode, apply mesh backgrounds, and manage glassmorphism effects.
- **Premium Glassmorphic UI**: High-end modern design utilizing Framer Motion for sophisticated animations, including a collapsible sidebar that compresses to an icon-only view to save screen real estate.
- **Organized Navigation**: A tabbed sidebar layout that separates Channels from Direct Messages, coupled with a Universal Quick Search that filters both lists simultaneously.
- **User Discovery**: Seamlessly discover and connect with other users. The welcome screen provides immediate access to start new conversations.
- **Real-time Notifications**: Visual toasts and sound alerts for incoming messages and invitations.
- **Account Management**: Secure options for users to change their passwords or completely delete their accounts with full database transaction safety.
- **Personalized Profiles**: Manage identity using custom usernames and avatars.
- **Typing Presence**: Real-time feedback showing when colleagues are actively typing.

## Tech Stack

### Frontend

- **React 19** (Vite context)
- **Tailwind CSS 4** (Modern styling)
- **Framer Motion** (Premium animations and interactions)
- **Lucide React** (Vector iconography)
- **React Hot Toast** (Real-time notifications)
- **Axios** (API communication)

### Backend

- **Node.js & Express**
- **Socket.io** (WebSockets)
- **Prisma ORM** (Database management)
- **PostgreSQL** (Primary persistence)
- **Redis** (Infrastructure health and caching)
- **JWT & Bcrypt** (Security and Authentication)

---

## Getting Started

### Quick Start with Docker (Recommended)

The easiest way to get Relay up and running is by using Docker:

1. **Clone the Repository**
2. **Launch Containers**:

   ```bash
   docker-compose up --build
   ```

3. **Access the Application**: Navigate to `http://localhost:3000` in your web browser.

---

## Project Structure

```text
chat-app/
├── backend/            # Express server, Prisma models, Socket handlers
├── frontend/           # React application, Tailwind styles, API hooks
├── docker-compose.yml  # Full orchestrated environment
└── README.md           # You are here
```

## License

This project is licensed under the ISC License.
