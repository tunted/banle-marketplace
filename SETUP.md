# Setup Instructions

## Issue: ERR_CONNECTION_REFUSED

The error occurs because dependencies haven't been installed yet. Follow these steps:

## Step 1: Install Dependencies

Open a terminal (PowerShell, CMD, or Git Bash) in this directory and run:

```bash
npm install
```

**If `npm` is not recognized:**
1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Choose the LTS (Long Term Support) version
3. Restart your terminal after installation
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

To get these values:
1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project or select an existing one
3. Go to Project Settings → API
4. Copy the "Project URL" and "anon/public" key

## Step 3: Start Development Server

After installing dependencies:

```bash
npm run dev
```

You should see output like:
```
▲ Next.js 14.2.5
- Local:        http://localhost:3000
```

Then open `http://localhost:3000` in your browser.

## Step 4: Set Up Supabase Database (Optional)

If you want to test the products feature:
1. Go to your Supabase dashboard → SQL Editor
2. Run the SQL from `supabase-products-setup.sql`

## Troubleshooting

- **Port 3000 already in use?** Next.js will automatically use 3001, 3002, etc.
- **Still getting errors?** Check the terminal output for specific error messages
- **TypeScript errors?** Make sure all dependencies are installed correctly

