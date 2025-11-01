# Deployment Guide - Bán Lẹ Production Setup

## 🚀 Quick Start

This guide covers production deployment to Vercel with Supabase backend.

## 📋 Prerequisites

1. Supabase account (free tier supports up to 100k monthly users)
2. Vercel account (free tier available)
3. Domain name (optional, but recommended)

## 🔧 Supabase Setup

### 1. Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  images TEXT[], -- Array of image URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location);

-- Enable Row Level Security
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read listings
CREATE POLICY "Allow public read access on listings"
ON listings
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Allow anyone to insert listings (anonymous posting)
CREATE POLICY "Allow anonymous insert access on listings"
ON listings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

### 2. Storage Bucket Setup

1. Go to **Storage** → **Create Bucket**
2. Name: `listings`
3. Make it **Public**
4. Add storage policies:

```sql
-- Allow public read access to listings bucket
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listings');

-- Allow anonymous uploads to listings bucket
CREATE POLICY "Allow anonymous uploads"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'listings');
```

### 3. Get API Keys

From Supabase Dashboard:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **API Settings** → **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

⚠️ **Never expose the service role key in client-side code!**

## 🌐 Vercel Deployment

### 1. Connect Repository

```bash
# Push your code to GitHub/GitLab/Bitbucket
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key

### 3. Configure Build Settings

Vercel will auto-detect Next.js. Ensure:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

### 4. Enable ISR

ISR is already configured in the code:
- Homepage: `revalidate: 60` (60 seconds)
- Listing pages: `revalidate: 60` (60 seconds)

This means pages are regenerated every 60 seconds for fresh content.

## 💰 Cost Optimization

### Estimated Monthly Costs (< $30/month)

**Supabase Free Tier:**
- Database: 500 MB (sufficient for ~100k listings)
- Storage: 1 GB (can store ~10,000 images)
- Bandwidth: 5 GB (handles ~100k page views)

**Vercel Free Tier:**
- Bandwidth: 100 GB
- Function executions: 100 GB-hours
- ISR revalidations included

**Upgrade Path (when scaling):**
- Supabase Pro: $25/month (adds more storage and bandwidth)
- Vercel Pro: $20/month (adds team features)

**Total: ~$0-45/month for 100k users**

### Image Optimization Tips

1. **Automatic Compression**: Images > 500KB are compressed before upload
2. **Next.js Image Optimization**: Automatic WebP/AVIF conversion
3. **Lazy Loading**: Images load only when visible
4. **CDN**: Vercel + Supabase CDN for global delivery

## 🔒 Security Best Practices

1. **Rate Limiting**: Client-side rate limiting (3 posts/hour) implemented
   - For production: implement server-side rate limiting with Redis
2. **Input Validation**: Phone numbers validated before submission
3. **RLS Policies**: Database protected with Row Level Security
4. **Environment Variables**: Never commit `.env.local` to git
5. **HTTPS**: Vercel automatically provides SSL certificates

## 📊 Monitoring & Analytics

### Recommended Tools (Free):

1. **Vercel Analytics**: Built-in performance monitoring
2. **Supabase Dashboard**: Database usage and query performance
3. **Google Analytics**: User behavior tracking (optional)

### Key Metrics to Monitor:

- Page load times (target: < 2s)
- Database query performance
- Storage usage
- API request volume
- Error rates

## 🚦 Performance Checklist

- ✅ ISR enabled (60s revalidation)
- ✅ Image optimization (Next.js Image component)
- ✅ Lazy loading for images
- ✅ Server components (minimal client JS)
- ✅ CDN delivery (Vercel + Supabase)
- ✅ Database indexes created
- ✅ Rate limiting implemented
- ✅ Image compression before upload

## 🔄 Production Updates

After deployment:

1. **Database Migrations**: Run in Supabase SQL Editor
2. **Code Updates**: Push to main branch → auto-deploys
3. **ISR Revalidation**: Happens automatically every 60s
4. **Cache Invalidation**: Use Vercel dashboard if needed

## 🆘 Troubleshooting

### Common Issues:

1. **RLS Policy Errors**: Check Supabase policies are correct
2. **Image Upload Fails**: Verify storage bucket is public
3. **ISR Not Working**: Check `revalidate` export in pages
4. **Build Errors**: Check environment variables in Vercel

## 📝 Environment Variables Template

Create `.env.local` (never commit):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Never add service role key here!
```

## ✅ Post-Deployment Checklist

- [ ] Supabase database table created
- [ ] Storage bucket created and public
- [ ] RLS policies configured
- [ ] Environment variables set in Vercel
- [ ] Domain configured (optional)
- [ ] SSL certificate active
- [ ] Test post submission works
- [ ] Test image upload works
- [ ] Verify ISR is working (check page source)
- [ ] Monitor error logs

---

**Need Help?** Check the main README.md for local development setup.

