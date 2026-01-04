# Set Up Supabase NOW - Step by Step

Follow these exact steps to get authentication working:

## Step 1: Create Supabase Account (1 minute)

1. Open your browser and go to: **https://supabase.com**
2. Click **"Start your project"** or **"Sign In"**
3. Sign up with GitHub (easiest) or your email
4. You'll be taken to your dashboard

## Step 2: Create New Project (2 minutes)

1. Click **"New Project"** (big green button)
2. If prompted, create a new organization (just give it any name like "HireBest")
3. Fill in the project details:
   - **Name**: `hirebest` (or anything you want)
   - **Database Password**: Click the generate button to create a strong password
   - **SAVE THIS PASSWORD SOMEWHERE** (you'll need it later)
   - **Region**: Choose the one closest to you (e.g., "US West" or "US East")
   - **Pricing Plan**: Leave as "Free" (it's perfect for development)
4. Click **"Create new project"**
5. Wait 1-2 minutes while it sets up (you'll see a loading screen)

## Step 3: Get Your Credentials (1 minute)

Once your project is ready:

1. In the left sidebar, click the **Settings** icon (⚙️ gear icon at bottom)
2. Click **"API"** under Project Settings
3. You'll see a page with your credentials:

   **Project URL** (looks like this):
   ```
   https://abcdefghijklmnop.supabase.co
   ```

   **API Keys** section shows:
   - `anon` `public` key (long string starting with "eyJ...")
   - `service_role` key (another long string)

4. **Keep this page open** - you'll copy these values next

## Step 4: Update Your .env.local File (1 minute)

1. In VS Code (or your editor), open the file: `.env.local`
2. It currently looks like this:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. Replace the values with YOUR ACTUAL credentials from Supabase:

   **Copy the Project URL** and replace this line:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   ```

   **Copy the anon public key** and replace this line:
   ```bash
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
   ```

   **Copy the service_role key** and replace this line:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
   ```

4. **Save the file** (Cmd/Ctrl + S)

## Step 5: Create the Database Tables (2 minutes)

Back in Supabase:

1. In the left sidebar, click the **SQL Editor** icon (looks like </> )
2. Click **"New query"** button
3. In your project, open the file: `supabase/schema.sql`
4. **Select ALL the code** in that file (Cmd/Ctrl + A)
5. **Copy it** (Cmd/Ctrl + C)
6. Go back to Supabase SQL Editor
7. **Paste the code** into the editor (Cmd/Ctrl + V)
8. Click **"Run"** button (or press Cmd/Ctrl + Enter)
9. Wait a few seconds - you should see "Success. No rows returned" at the bottom

## Step 6: Verify Database is Created

1. In Supabase left sidebar, click **Table Editor** (looks like a table icon)
2. You should see a list of tables:
   - candidates
   - companies
   - jobs
   - recruiters
   - applications
   - assessments
   - assessment_results
   - chat_messages
   - question_analysis

If you see these tables, **SUCCESS!** ✅

## Step 7: Add Sample Data (Optional but Recommended)

1. Go back to **SQL Editor**
2. Click **"New query"**
3. Open the file: `supabase/seed.sql` in your project
4. Copy all the code
5. Paste into Supabase SQL Editor
6. Click **"Run"**

This adds 2 sample companies and 2 sample jobs to your database.

## Step 8: Restart Your Dev Server

This is **CRITICAL** - environment variables only load when the server starts:

1. Go to your terminal where the dev server is running
2. Press **Ctrl + C** to stop it
3. Run `npm run dev` again
4. Wait for it to say "Ready"

## Step 9: Test Login!

1. Open **http://localhost:3000**
2. You should see the login page
3. Click **"Sign up"** (you don't have an account yet)
4. Choose "Candidate" or "Recruiter"
5. Enter:
   - Name: Your name
   - Email: Any email (test@example.com works)
   - Password: At least 6 characters
6. Click **"Sign Up"**
7. **You should be logged in!** You'll see the assessments dashboard with your name in the top-right

## Troubleshooting

### Still redirecting to login?
- Make sure you saved `.env.local`
- Make sure you restarted the dev server (Ctrl+C then npm run dev)
- Check browser console (F12) for errors

### "Invalid API key" error?
- Double-check you copied the FULL key from Supabase (they're very long)
- Make sure there are no extra spaces in `.env.local`

### Can't see tables in Supabase?
- Make sure you ran the ENTIRE `schema.sql` file
- Check the SQL Editor for any error messages

### Signup not working?
- Check browser console (F12) for errors
- Verify all 3 credentials in `.env.local` are correct

---

## Quick Reference

**Supabase Dashboard**: https://supabase.com/dashboard
**Your Project**: https://supabase.com/dashboard/project/YOUR-PROJECT-ID

**Files to update**:
- `.env.local` (with your Supabase credentials)

**SQL to run in Supabase**:
1. `supabase/schema.sql` (creates tables)
2. `supabase/seed.sql` (adds sample data - optional)

---

**Need help?** Check the error message in your browser console (F12 → Console tab) and let me know what it says!
