# E-Commerce Store

A modern e-commerce platform built with Next.js 14, TypeScript, Tailwind CSS, Supabase, and shadcn/ui.

## Features

- 🏠 **Home Page** - Featured products with modern UI
- 🔐 **Authentication** - Sign in/Sign up with Supabase
- 🛒 **Shopping Cart** - Full cart functionality with quantity management
- 🎨 **Modern UI** - Built with shadcn/ui components and Tailwind CSS

## Tech Stack

- **Next.js 14** - App Router with React Server Components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Authentication and backend services
- **shadcn/ui** - Beautiful UI components

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your Project URL and anon/public key
4. Add them to your `.env.local` file

## Project Structure

```
├── app/
│   ├── auth/
│   │   └── callback/     # Supabase auth callback
│   ├── cart/            # Shopping cart page
│   ├── login/           # Authentication page
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/
│   ├── ui/              # shadcn/ui components
│   └── navbar.tsx       # Navigation component
└── lib/
    ├── supabase/        # Supabase client configuration
    └── utils.ts         # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

