#!/usr/bin/env python3
"""
Convert HTML files to PDF and combine them into a single comprehensive manual.
"""

import os
import glob
from weasyprint import HTML, CSS
from PyPDF2 import PdfMerger
import sys

def convert_html_to_pdf(html_file, pdf_file):
    """Convert a single HTML file to PDF."""
    try:
        print(f"Converting {html_file} to {pdf_file}...")
        
        # Custom CSS for better PDF formatting
        pdf_css = CSS(string='''
            @page {
                size: A4;
                margin: 2cm;
                @bottom-center {
                    content: counter(page);
                    font-size: 10pt;
                    color: #666;
                }
            }
            
            body {
                font-family: 'Segoe UI', Arial, sans-serif;
                line-height: 1.6;
                color: #1e293b;
            }
            
            .header {
                page-break-inside: avoid;
                margin-bottom: 2em;
            }
            
            .chapter {
                page-break-inside: avoid;
                margin-bottom: 1.5em;
            }
            
            h1, h2 {
                page-break-after: avoid;
            }
            
            h3 {
                page-break-after: avoid;
                margin-top: 1.5em;
            }
            
            table {
                page-break-inside: avoid;
                margin: 1em 0;
            }
            
            .step-box, .warning-box, .info-box, .critical-box, 
            .best-practice, .solution-box, .problem-box {
                page-break-inside: avoid;
                margin: 1em 0;
            }
            
            /* Ensure good page breaks */
            .chapter {
                orphans: 3;
                widows: 3;
            }
        ''')
        
        HTML(filename=html_file).write_pdf(pdf_file, stylesheets=[pdf_css])
        print(f"Successfully converted {html_file}")
        return True
        
    except Exception as e:
        print(f"Error converting {html_file}: {str(e)}")
        return False

def combine_pdfs(pdf_files, output_file):
    """Combine multiple PDF files into one."""
    try:
        print(f"Combining {len(pdf_files)} PDF files into {output_file}...")
        
        merger = PdfMerger()
        
        for pdf_file in pdf_files:
            if os.path.exists(pdf_file):
                merger.append(pdf_file)
                print(f"Added {pdf_file} to combined PDF")
            else:
                print(f"Warning: {pdf_file} not found, skipping...")
        
        merger.write(output_file)
        merger.close()
        
        print(f"Successfully created combined PDF: {output_file}")
        return True
        
    except Exception as e:
        print(f"Error combining PDFs: {str(e)}")
        return False

def main():
    """Main conversion process."""
    print("Starting Juno Fast Admin Portal User Manual PDF Generation")
    print("=" * 60)
    
    # Get current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define HTML files in order
    html_files = [
        "01-introduction.html",
        "02-dashboard-guide.html", 
        "03-order-management.html",
        "04-user-management.html",
        "05-system-configuration.html",
        "06-best-practices.html",
        "07-troubleshooting.html"
    ]
    
    # Convert each HTML to PDF
    pdf_files = []
    failed_conversions = []
    
    for html_file in html_files:
        html_path = os.path.join(current_dir, html_file)
        pdf_file = html_file.replace('.html', '.pdf')
        pdf_path = os.path.join(current_dir, pdf_file)
        
        if os.path.exists(html_path):
            if convert_html_to_pdf(html_path, pdf_path):
                pdf_files.append(pdf_path)
            else:
                failed_conversions.append(html_file)
        else:
            print(f"Warning: {html_path} not found, skipping...")
            failed_conversions.append(html_file)
    
    print("\n" + "=" * 60)
    print(f"Conversion Summary:")
    print(f"Successfully converted: {len(pdf_files)} files")
    if failed_conversions:
        print(f"Failed conversions: {len(failed_conversions)} files")
        for failed in failed_conversions:
            print(f"  - {failed}")
    
    # Combine all PDFs into one comprehensive manual
    if pdf_files:
        output_file = os.path.join(current_dir, "Juno_Fast_Admin_Portal_User_Manual.pdf")
        
        print("\n" + "=" * 60)
        if combine_pdfs(pdf_files, output_file):
            print(f"\n✅ SUCCESS: Complete user manual created!")
            print(f"📄 File location: {output_file}")
            print(f"📊 Total sections: {len(pdf_files)}")
            
            # Get file size
            if os.path.exists(output_file):
                file_size = os.path.getsize(output_file)
                file_size_mb = file_size / (1024 * 1024)
                print(f"📁 File size: {file_size_mb:.1f} MB")
        else:
            print("❌ Failed to create combined PDF")
            return 1
    else:
        print("❌ No PDF files were successfully created")
        return 1
    
    print("\n" + "=" * 60)
    print("PDF Generation Complete!")
    return 0

if __name__ == "__main__":
    sys.exit(main())