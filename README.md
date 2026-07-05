# Audiobook Library Frontend

A modern, responsive web application for browsing, playing, and managing an audiobook library. Built with **Vue 3**, **Vite**, **Vue Router**, and **Vanilla CSS**.

---

## 📖 Table of Contents
1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [Architecture & Backend Interaction](#-architecture--backend-interaction)
4. [Configuration](#%EF%B8%8F-configuration)
   - [Environment Variables](#environment-variables)
   - [Config file (config.js)](#config-file-configjs)
5. [Scripts & Tasks](#%EF%B8%8F-scripts--tasks)
6. [Deployment to Raspberry Pi](#-deployment-to-raspberry-pi)
   - [Deployment Script Flow](#deployment-script-flow)
   - [Nginx Production Configuration](#nginx-production-configuration)

---

## 🔍 Overview

This repository contains the frontend application for the **Audiobook Library**. It connects to a Spring Boot/Java backend (or any REST API matching the contract) to fetch audiobook metadata, stream audio files, handle covers, and manage user preferences/authorization.

---

## ✨ Key Features

- **Audiobook Browser**: View audiobooks in grid or list formats, search titles/authors, and sort by relevance, popularity, duration, and publication date.
- **Genre & Subgenre Filters**: Easy filtering using sidebar or dropdown selectors that automatically calculate counts based on available audiobooks.
- **Favorites System**: Users can bookmark audiobooks, which are saved in their profile and synced with the database.
- **Google OAuth Integration**: Login seamlessly with Google OAuth. The frontend parses JWT payload tokens to check user profiles, admin status, and content clearance.
- **Restricted Content Access**: Double-click mechanism to unlock and display restricted content for users with appropriate clearances.
- **Administrative Panel**: 
  - Edit metadata of audiobooks.
  - Upload audiobooks wrapped in `.zip` files directly from the UI.
  - Manage users, toggle admin privileges, and manage restricted content permissions.

---

## 🔌 Architecture & Backend Interaction

The application communicates with the backend asynchronously using native `fetch` requests. 

All communications are centralized in:
📂 [src/services/audiobookService.js](file:///c:/projetos/fe-audiobook-library/src/services/audiobookService.js)

### Authentication & Authorization Headers
For routes requiring security clearance, the frontend automatically intercepts and injects JWT authorization credentials:
```javascript
const getAuthHeaders = (headers = {}) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    return { ...headers, 'Authorization': `Bearer ${token}` }
  }
  return headers
}
```
Every time a user logs in via Google OAuth, they are redirected back to the frontend route `/login-success`, which retrieves the JWT token from the query parameters, saves it into `localStorage` under `auth_token`, and redirects the user home.

---

## ⚙️ Configuration

### Environment Variables

The project uses two environment files in the root folder to manage configuration differences:

#### 1. `.env.development`
Used when running locally during development.
```env
VITE_BACKEND_HOST=http://localhost:8086
```

#### 2. `.env.production`
Used during production build and deployment phases.
```env
VITE_BACKEND_HOST=
DEPLOY_HOST=192.168.1.150
DEPLOY_USERNAME=paull
DEPLOY_REMOTE_DIR=/var/www/html/audiobook-fe
```
- **`VITE_BACKEND_HOST`**: Empty in production because the frontend is served from the same server host (e.g. via Nginx reverse proxy), routing relative paths `/audiobook-library/*`.
- **`DEPLOY_HOST`**: IP address of the target deployment target (e.g., Raspberry Pi).
- **`DEPLOY_USERNAME`**: SSH username for accessing the Raspberry Pi.
- **`DEPLOY_REMOTE_DIR`**: Absolute path where the static files will reside on the Raspberry Pi.

---

### Config file (`config.js`)
📂 [src/config.js](file:///c:/projetos/fe-audiobook-library/src/config.js)

This file computes URLs dynamically depending on whether the app is in production mode (`import.meta.env.PROD`):

1. **`HOST`**: Decides whether to use relative pathing or the backend development host:
   ```javascript
   export const HOST = import.meta.env.PROD
     ? ''
     : (import.meta.env.VITE_BACKEND_HOST !== undefined ? import.meta.env.VITE_BACKEND_HOST : 'http://localhost:8086');
   ```
2. **`GOOGLE_LOGIN_URL`**: Google OAuth redirects do not support `.local` domain names or bare local IP addresses in certain OAuth scopes. In production, we route through a registered wildcard service like `nip.io` mapped to the Raspberry Pi IP (`192.168.1.150.nip.io`).
   ```javascript
   export const GOOGLE_LOGIN_URL = import.meta.env.PROD
     ? 'https://192.168.1.150.nip.io/audiobook-library/oauth2/authorization/google'
     : `${API_URL}/oauth2/authorization/google`;
   ```
3. **`IMAGES_URL` & `DOWNLOADS_URL`**: 
   - **In development**: Routes through the backend api endpoints.
   - **In production**: Served directly by Nginx (for static performance optimizations) under `/images` and `/downloads`.
   ```javascript
   export const IMAGES_URL = import.meta.env.PROD ? '/images' : `${API_URL}/images`;
   export const DOWNLOADS_URL = import.meta.env.PROD ? '/downloads' : `${API_URL}/downloads`;
   ```

---

## 🛠️ Scripts & Tasks

Define tasks inside [package.json](file:///c:/projetos/fe-audiobook-library/package.json)'s `scripts` block:

| Script / Task | Command | Description |
| :--- | :--- | :--- |
| **`dev`** | `npm run dev` | Runs the Vite dev server locally at `http://localhost:5173`. |
| **`build`** | `npm run build` | Compiles and optimizes assets into a local `/dist` directory for production. |
| **`preview`** | `npm run preview` | Spins up a local preview server of the generated `/dist` build. |
| **`deploy`** | `npm run deploy` | Triggers the automated build and SSH transfer script to send files to the Raspberry Pi. |

---

## 🚀 Deployment to Raspberry Pi

The project includes an automatic deployment pipeline powered by Node.js and SSH.

### Deployment Script Flow
📂 [src/deploy.js](file:///c:/projetos/fe-audiobook-library/src/deploy.js)

When you run `npm run deploy`, the script executes the following steps:
1. **Compile Production Code**: Runs `npm run build` locally to generate the latest production bundle inside `/dist`.
2. **Connect to Raspberry Pi**: Initiates an SSH session using the credentials set in `.env.production` and the SSH private key situated at `~/.ssh/id_ed25519`.
3. **Set Up Remote Folder**: Ensures the remote folder specified in `DEPLOY_REMOTE_DIR` exists on the Raspberry Pi:
   ```bash
   sudo mkdir -p /var/www/html/audiobook-fe
   sudo chown -R paull:paull /var/www/html/audiobook-fe
   ```
4. **Deploy Assets**: Recursively transfers all files inside `/dist` to the Raspberry Pi over SFTP (with high concurrency).
5. **Restart Nginx**: Restarts Nginx service on the Raspberry Pi:
   ```bash
   sudo systemctl restart nginx
   ```

> [!IMPORTANT]
> To run the deploy script from a Windows environment, ensure your Raspberry Pi public SSH key is configured correctly and your private key is located at `%USERPROFILE%\.ssh\id_ed25519`.

---

### Nginx Production Configuration

To correctly host the built single page application (SPA), route backend API calls, and serve static images/downloads, configure Nginx on your Raspberry Pi as follows:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name 192.168.1.150.nip.io; # Or your server IP/domain

    # Frontend Static Site
    root /var/www/html/audiobook-fe;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Reverse Proxy
    location /audiobook-library {
        proxy_pass http://localhost:8080; # Port of your backend service
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static Images Direct Server (Optimized)
    location /images {
        alias /var/audiobooks/images/; # Absolute path to audiobook cover images
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    # Static Audiobook Downloads Direct Server
    location /downloads {
        alias /var/audiobooks/files/; # Absolute path to physical audiobook files
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```
