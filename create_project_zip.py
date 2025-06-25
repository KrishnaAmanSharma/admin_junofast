#!/usr/bin/env python3
import os
import zipfile
import sys
from pathlib import Path

def should_exclude(file_path, exclude_patterns):
    """Check if a file/directory should be excluded based on patterns."""
    file_name = os.path.basename(file_path)
    
    for pattern in exclude_patterns:
        if pattern.startswith('*') and pattern.endswith('*'):
            # Pattern like *backup*
            middle = pattern[1:-1]
            if middle in file_name:
                return True
        elif pattern.startswith('*'):
            # Pattern like *.log
            if file_name.endswith(pattern[1:]):
                return True
        elif pattern.endswith('*'):
            # Pattern like setup-*
            if file_name.startswith(pattern[:-1]):
                return True
        else:
            # Exact match
            if file_name == pattern:
                return True
    
    return False

def create_project_zip():
    print("Creating project zip file using Python...")
    
    # Define what to exclude
    exclude_patterns = [
        'node_modules',
        '.git',
        'dist',
        'build',
        '*.log',
        '.env*',
        'project-complete.*',
        'create-project-zip.js',
        'create_project_zip.py',
        'apply-schema-fixes.js',
        'check-and-complete-questions.js',
        'create-vendor-responses.js',
        'execute-schema-fix.js',
        'fix-order-status.js',
        'house-relocation-questions-script.js',
        'setup-*.js',
        'user-manual',
        '*-backup.ts',
        '*-broken*.ts',
        '__pycache__',
        '*.pyc',
        '.cache',
        '.pythonlibs',
        '.uv',
        'pyproject.toml',
        'uv.lock',
        '*.sql'
    ]
    
    # Get current directory (project root)
    project_root = Path('.')
    zip_filename = 'project-complete.zip'
    
    try:
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Walk through all files and directories
            for root, dirs, files in os.walk(project_root):
                # Filter out excluded directories
                dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d), exclude_patterns)]
                
                for file in files:
                    file_path = os.path.join(root, file)
                    
                    # Skip excluded files
                    if should_exclude(file_path, exclude_patterns):
                        continue
                    
                    # Skip the zip file itself if it exists
                    if file == zip_filename:
                        continue
                    
                    # Calculate relative path for the zip
                    rel_path = os.path.relpath(file_path, project_root)
                    
                    # Add file to zip with timestamp handling
                    try:
                        zipf.write(file_path, rel_path)
                        print(f"Added: {rel_path}")
                    except ValueError as e:
                        if "ZIP does not support timestamps before 1980" in str(e):
                            # Create ZipInfo manually with a valid timestamp
                            info = zipfile.ZipInfo(rel_path)
                            info.date_time = (1980, 1, 1, 0, 0, 0)  # Set to 1980-01-01
                            with open(file_path, 'rb') as src:
                                zipf.writestr(info, src.read())
                            print(f"Added (fixed timestamp): {rel_path}")
                        else:
                            raise
        
        # Get file size
        zip_size = os.path.getsize(zip_filename)
        zip_size_mb = zip_size / (1024 * 1024)
        
        print(f"\nProject zip created successfully: {zip_filename}")
        print(f"File size: {zip_size_mb:.2f} MB")
        print(f"Total files: {len(zipf.namelist()) if 'zipf' in locals() else 'Unknown'}")
        
        return True
        
    except Exception as e:
        print(f"Error creating zip file: {str(e)}")
        return False

if __name__ == "__main__":
    success = create_project_zip()
    sys.exit(0 if success else 1)