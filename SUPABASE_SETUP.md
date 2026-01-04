# Supabase Setup Guide for HireBest

Follow these steps to set up your Supabase backend:

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Sign in with GitHub (recommended) or email
4. Create a new organization if you don't have one
5. Click "New Project"
6. Fill in:
   - **Project name**: `hirebest` (or your choice)
   - **Database password**: Generate a strong password (save this!)
   - **Region**: Choose closest to you (e.g., US West, US East, Europe)
   - **Pricing plan**: Free tier is perfect for development
7. Click "Create new project"
8. Wait 1-2 minutes for the project to be provisioned

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, click the **Settings** icon (gear) in the left sidebar
2. Click **API** under Project Settings
3. You'll see:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **API Keys**:
     - `anon` `public` key (safe to use in browser)
     - `service_role` key (keep this secret!)

## Step 3: Add Credentials to Your Project

1. Open the `.env.local` file in your HireBest project
2. Replace the placeholder values with your actual Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

3. Save the file

## Step 4: Run the Database Schema

1. In your Supabase dashboard, click the **SQL Editor** icon in the left sidebar
2. Click **New query**
3. Open the file `supabase/schema.sql` in your project
4. Copy ALL the SQL code from `schema.sql`
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for it to complete (should say "Success. No rows returned")

## Step 5: Add Sample Data (Optional)

1. In the SQL Editor, click **New query** again
2. Open the file `supabase/seed.sql`
3. Copy and paste the SQL code
4. Click **Run**
5. This will add sample companies, jobs, and assessments

## Step 6: Verify the Database

1. Click the **Table Editor** icon in the left sidebar
2. You should see all your tables:
   - companies
   - candidates
   - recruiters
   - jobs
   - applications
   - assessments
   - assessment_results
   - chat_messages
   - question_analysis

3. Click on `companies` table - you should see 2 sample companies
4. Click on `jobs` table - you should see 2 sample jobs

## Step 7: Test the Connection

1. Restart your Next.js development server:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. Your app should now connect to Supabase!

## Troubleshooting

### "Invalid API key" error
- Double-check that you copied the correct keys from Supabase
- Make sure there are no extra spaces in the `.env.local` file
- Restart your dev server after updating `.env.local`

### "relation does not exist" error
- Make sure you ran the entire `schema.sql` in the SQL Editor
- Check the SQL Editor for any error messages

### Tables not showing up
- Refresh the Supabase dashboard
- Try clicking on a different tab and back to Table Editor

## Next Steps

Once Supabase is set up:
1. ✅ Authentication will work automatically
2. ✅ You can create candidate and recruiter accounts
3. ✅ Assessment results can be saved to the database
4. ✅ The app will use real data instead of sample data

## Security Note

- **Never commit `.env.local` to Git** (it's already in `.gitignore`)
- **Never share your `service_role` key** publicly
- The `anon` key is safe to use in your frontend code

---

Need help? Check the [Supabase documentation](https://supabase.com/docs) or ask for assistance!
