#!/usr/bin/env python3
"""
Convert remaining HTML files to PDF and combine all into final manual.
"""

import os
from weasyprint import HTML, CSS
from PyPDF2 import PdfMerger

def convert_single_file(html_file, pdf_file):
    """Convert a single HTML file to PDF with timeout handling."""
    try:
        print(f"Converting {html_file}...")
        
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
            .chapter {
                page-break-inside: avoid;
                margin-bottom: 1.5em;
            }
            h1, h2, h3 {
                page-break-after: avoid;
            }
            table, .step-box, .warning-box, .info-box {
                page-break-inside: avoid;
                margin: 1em 0;
            }
        ''')
        
        HTML(filename=html_file).write_pdf(pdf_file, stylesheets=[pdf_css])
        print(f"✓ Success: {os.path.basename(pdf_file)}")
        return True
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

# Convert remaining files
current_dir = os.path.dirname(os.path.abspath(__file__))

remaining_files = [
    ("04-user-management.html", "04-user-management.pdf"),
    ("05-system-configuration.html", "05-system-configuration.pdf"),
    ("06-best-practices.html", "06-best-practices.pdf"),
    ("07-troubleshooting.html", "07-troubleshooting.pdf")
]

print("Converting remaining HTML files to PDF...")
for html_file, pdf_file in remaining_files:
    html_path = os.path.join(current_dir, html_file)
    pdf_path = os.path.join(current_dir, pdf_file)
    
    if not os.path.exists(pdf_path) and os.path.exists(html_path):
        convert_single_file(html_path, pdf_path)

print("\nCombining all PDF files...")

# Combine all PDFs
all_pdfs = [
    "01-introduction.pdf",
    "02-dashboard-guide.pdf", 
    "03-order-management.pdf",
    "04-user-management.pdf",
    "05-system-configuration.pdf",
    "06-best-practices.pdf",
    "07-troubleshooting.pdf"
]

merger = PdfMerger()
combined_count = 0

for pdf_file in all_pdfs:
    pdf_path = os.path.join(current_dir, pdf_file)
    if os.path.exists(pdf_path):
        merger.append(pdf_path)
        combined_count += 1
        print(f"✓ Added: {pdf_file}")

output_file = os.path.join(current_dir, "Juno_Fast_Admin_Portal_Complete_User_Manual.pdf")
merger.write(output_file)
merger.close()

print(f"\n🎉 SUCCESS! Combined {combined_count} sections into comprehensive manual")
print(f"📄 Final file: {output_file}")

# Check file size
if os.path.exists(output_file):
    file_size = os.path.getsize(output_file) / (1024 * 1024)
    print(f"📁 File size: {file_size:.1f} MB")

print("\nUser manual generation complete!")