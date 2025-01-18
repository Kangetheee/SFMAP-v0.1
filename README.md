# App v0.1

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Getting Started](#getting-started)
5. [Project Structure](#project-structure)
6. [Deployment](#deployment)
7. [Credits](#credits)
8. [Demo](#demo)

---

## Overview

**App v0.1** is a versatile application built using **Next.js**, **Drizzle ORM**, **TailwindCSS**, and a range of modern libraries to support seamless development and functionality. It integrates **Clerk Authentication**, **Radix UI components**, and **Zod validation** to create a robust, feature-rich app. The backend leverages **Neon Database** for PostgreSQL and includes utilities for database migration and seeding.

[![App v0.1 Video Overview](https://img.youtube.com/vi/your-video-id/0.jpg)](https://www.youtube.com/watch?v=your-video-id)

---

## Features

- **Authentication**: Secure user authentication via Clerk.
- **Database Integration**: Managed using Drizzle ORM and Neon Database.
- **UI Components**: Built with Radix UI for accessibility and customization.
- **Form Validation**: Leveraging Zod and React Hook Form.
- **Charts and Visualizations**: Dynamic data visualization with Recharts.
- **Animations**: Smooth transitions using TailwindCSS Animate.

---

## Technologies Used

- **Next.js**: Framework for server-side rendering and static site generation.
- **Drizzle ORM**: Type-safe SQL ORM for database management.
- **TailwindCSS**: Utility-first CSS framework for styling.
- **Clerk**: Authentication solution for modern applications.
- **Neon Database**: Serverless PostgreSQL database.
- **Radix UI**: Accessible UI primitives for building interfaces.
- **Zod**: Type-safe schema validation.
- **React Query**: State management for server-side data.

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** (>= 18.x)
- **npm** or **yarn**

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/app-v0.1.git
   cd app-v0.1
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   Create a `.env` file in the root directory with the required configuration for database and authentication.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`.

---

## Project Structure

```
C:.
├───.next
│   ├───cache
│   │   ├───swc
│   │   │   └───plugins
│   │   │       └───v7_windows_x86_64_4.0.0
│   │   └───webpack
│   │       ├───client-development
│   │       ├───edge-server-development
│   │       └───server-development
│   ├───server
│   │   ├───app
│   │   │   └───(auth)
│   │   │       └───sign-in
│   │   │           └───[[...sign-in]]
│   │   ├───static
│   │   │   └───webpack
│   │   └───vendor-chunks
│   ├───static
│   │   ├───chunks
│   │   └───development
│   └───types
│       └───app
│           └───(auth)
│               └───sign-in
│                   └───[[...sign-in]]
├───app
│   ├───(auth)
│   │   ├───sign-in
│   │   │   └───[[...sign-in]]
│   │   └───sign-up
│   │       └───[[...sign-up]]
│   ├───(dashboard)
│   │   ├───accounts
│   │   ├───categories
│   │   └───transactions
│   └───api
│       └───[[...route]]
├───components
│   └───ui
├───db
├───drizzle
│   └───meta
├───features
│   ├───accounts
│   │   ├───api
│   │   ├───components
│   │   └───hooks
│   ├───categories
│   │   ├───api
│   │   ├───components
│   │   └───hooks
│   ├───summary
│   │   └───api
│   └───transactions
│       ├───api
│       ├───components
│       └───hooks
├───hooks
├───lib
├───providers
├───public
└───scripts
```

---

## Deployment

1. Build the project for production:

   ```bash
   npm run build
   ```

2. Start the production server:

   ```bash
   npm run start
   ```

3. Deploy to your hosting platform (e.g., Vercel, Netlify, or AWS).

---

## Credits

- **Tutorials**: Various open-source contributions.
- **Libraries and Frameworks**: Next.js, Drizzle ORM, Clerk, TailwindCSS.

---

## Demo

