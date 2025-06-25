# Windows Local Development Setup Guide

## Prerequisites

### 1. Install Node.js
1. Download Node.js from [https://nodejs.org/](https://nodejs.org/)
2. Install the LTS version (recommended)
3. Verify installation by opening Command Prompt and running:
   ```cmd
   node --version
   npm --version
   ```

### 2. Install Git (Optional but recommended)
1. Download Git from [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Install with default settings
3. Verify installation:
   ```cmd
   git --version
   ```

## Project Setup

### 1. Download the Project
You can either:
- **Option A**: Download as ZIP from Replit and extract
- **Option B**: Use Git to clone (if you have the repository URL)

### 2. Install Dependencies
1. Open Command Prompt or PowerShell
2. Navigate to your project folder:
   ```cmd
   cd path\to\your\project\folder
   ```
3. Install all dependencies:
   ```cmd
   npm install
   ```

### 3. Environment Setup
1. Create a `.env` file in the root directory
2. Add the following environment variables:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://your_username:your_password@localhost:5432/your_database

   # Supabase Configuration (if using Supabase)
   SUPABASE_URL=https://tdqqrjssnylfbjmpgaei.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw

   # Development Environment
   NODE_ENV=development
   ```

## Database Options

### Option 1: Use Existing Supabase Database (Recommended)
The app is already configured to use Supabase. No additional database setup needed.

### Option 2: Local PostgreSQL Setup
If you want to run a local database:

1. **Install PostgreSQL**:
   - Download from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
   - Install with default settings
   - Remember the password you set for the postgres user

2. **Create Database**:
   ```sql
   CREATE DATABASE juno_fast;
   ```

3. **Update DATABASE_URL** in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/juno_fast
   ```

## Running the Application

### 1. Start the Development Server
```cmd
npm run dev
```

### 2. Access the Application
- Open your web browser
- Navigate to: `http://localhost:5000`
- The app should load and be fully functional

## Project Structure
```
juno-fast/
├── client/           # React frontend
├── server/           # Express backend
├── shared/           # Shared types and schemas
├── vendor-app/       # Flutter mobile app (optional)
├── package.json      # Dependencies and scripts
└── README.md         # Project documentation
```

## Available Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
   - Kill the process using port 5000:
   ```cmd
   netstat -ano | findstr :5000
   taskkill /PID <process_id> /F
   ```

2. **Database Connection Issues**:
   - Verify DATABASE_URL is correct
   - Check if PostgreSQL service is running
   - Ensure database exists

3. **Node Modules Issues**:
   - Delete `node_modules` folder
   - Delete `package-lock.json`
   - Run `npm install` again

4. **Permission Issues**:
   - Run Command Prompt as Administrator
   - Or use PowerShell with execution policy:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### Windows-Specific Notes

1. **Path Separators**: Use backslashes (`\`) in Windows paths
2. **File Permissions**: Some npm packages might require admin privileges
3. **Antivirus**: Windows Defender might slow down npm install - consider adding project folder to exclusions

## Development Tools (Optional)

### Recommended Code Editor
- **Visual Studio Code**: [https://code.visualstudio.com/](https://code.visualstudio.com/)
- Install useful extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets

### Database Management
- **pgAdmin**: For PostgreSQL database management
- **Supabase Dashboard**: Web-based interface for Supabase

## Next Steps

1. Follow this guide to set up your environment
2. Run `npm run dev` to start the application
3. Access `http://localhost:5000` in your browser
4. You should see the Juno Fast admin dashboard

## Need Help?

If you encounter any issues:
1. Check the terminal/command prompt for error messages
2. Verify all prerequisites are installed correctly
3. Ensure environment variables are set properly
4. Check if all required ports are available

The application includes a complete admin dashboard for managing orders, vendors, and customers, plus the vendor broadcast system you've been testing.