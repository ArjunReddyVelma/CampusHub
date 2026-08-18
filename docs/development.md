# CampusHub Development Guide

This guide describes how to run and manage the codebase locally.

## 1. Prerequisites
*   Node.js (v18+)
*   MongoDB running locally or Atlas access

## 2. Setting Up Variables
Create `.env` inside `/server` and `/client` using their respective `.env.example` templates.

## 3. Running Locally

Install all dependencies first:
```bash
npm run install:all
```

To run both backend and frontend concurrently in development mode:
```bash
npm run dev
```

*   **Backend Server**: http://localhost:5000
*   **React Frontend (Vite)**: http://localhost:5173

## 4. Development Workflow
*   **Admin Seeding**: Run `npm run seed:admin` inside `/server` to seed the initial system administrator. Ensure `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are configured.
*   **Create feature branch**: `feature/your-feature-name`
*   **Check code quality**: Run linters if configured.
*   **Commit format**: Use semantic commits, e.g. `feat: implement user registration`
