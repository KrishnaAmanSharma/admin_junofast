import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('Creating project zip file...');

// Create a temporary directory for the clean project
const tempDir = '/tmp/project-export';
const zipPath = './project-complete.zip';

try {
  // Remove existing temp directory if it exists
  if (fs.existsSync(tempDir)) {
    execSync(`rm -rf ${tempDir}`);
  }

  // Create temp directory
  fs.mkdirSync(tempDir, { recursive: true });

  // Copy project files, excluding unnecessary items
  const excludePatterns = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '*.log',
    '.env*',
    'project-complete.zip',
    'create-project-zip.js',
    'apply-schema-fixes.js',
    'check-and-complete-questions.js',
    'create-vendor-responses.js',
    'execute-schema-fix.js',
    'fix-order-status.js',
    'house-relocation-questions-script.js',
    'setup-*.js',
    'user-manual',
    '*-backup.ts',
    '*-broken*.ts'
  ];

  // Copy files manually, excluding unwanted items
  const copyDirectory = (src, dest, excludePatterns) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      // Check if item should be excluded
      const shouldExclude = excludePatterns.some(pattern => {
        if (pattern.startsWith('*') && pattern.endsWith('*')) {
          const middle = pattern.slice(1, -1);
          return item.includes(middle);
        } else if (pattern.startsWith('*')) {
          return item.endsWith(pattern.slice(1));
        } else if (pattern.endsWith('*')) {
          return item.startsWith(pattern.slice(0, -1));
        } else {
          return item === pattern;
        }
      });
      
      if (shouldExclude) continue;
      
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        copyDirectory(srcPath, destPath, excludePatterns);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyDirectory('./', tempDir, excludePatterns);

  // Create a clean package.json without development-specific scripts
  const packageJsonPath = path.join(tempDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Clean up scripts to be more generic
    packageJson.scripts = {
      "dev": "NODE_ENV=development tsx server/index.ts",
      "build": "tsc && vite build",
      "start": "node dist/server/index.js",
      "db:push": "drizzle-kit push",
      "db:studio": "drizzle-kit studio"
    };

    // Remove any Replit-specific dependencies if they exist
    if (packageJson.devDependencies) {
      delete packageJson.devDependencies['@replit/vite-plugin-cartographer'];
      delete packageJson.devDependencies['@replit/vite-plugin-runtime-error-modal'];
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  // Create a README for setup instructions
  const readmePath = path.join(tempDir, 'README-SETUP.md');
  const readmeContent = `# Project Setup Instructions

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud)

## Setup Steps

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Database Setup:**
   - Create a PostgreSQL database
   - Set the DATABASE_URL environment variable:
     \`\`\`bash
     export DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
     \`\`\`
   - Push the database schema:
     \`\`\`bash
     npm run db:push
     \`\`\`

3. **Environment Variables:**
   Create a \`.env\` file in the root directory with:
   \`\`\`
   DATABASE_URL=your_postgresql_connection_string
   NODE_ENV=development
   \`\`\`

4. **Run the application:**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Access the application:**
   Open http://localhost:5000 in your browser

## Project Structure
- \`client/\` - Frontend React application
- \`server/\` - Backend Express server
- \`shared/\` - Shared schema and types
- \`drizzle.config.ts\` - Database configuration

## Database Management
- View database: \`npm run db:studio\`
- Update schema: \`npm run db:push\`

## Notes
- The application uses Supabase for database operations in the current setup
- Modify the database connection in \`server/storage.ts\` if needed
- The frontend is built with React, TypeScript, and Tailwind CSS
- The backend uses Express with TypeScript
`;

  fs.writeFileSync(readmePath, readmeContent);

  // Create the zip file
  console.log('Creating zip archive...');
  execSync(`cd /tmp && zip -r project-complete.zip project-export/`);
  
  // Move zip to current directory
  execSync(`mv /tmp/project-complete.zip ${zipPath}`);

  // Clean up temp directory
  execSync(`rm -rf ${tempDir}`);

  console.log(`Project zip created successfully: ${zipPath}`);
  console.log('File size:', execSync(`ls -lh ${zipPath} | awk '{print $5}'`).toString().trim());

} catch (error) {
  console.error('Error creating zip:', error.message);
  process.exit(1);
}