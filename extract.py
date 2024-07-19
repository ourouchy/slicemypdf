from PyPDF2 import PdfReader, PdfWriter

def extract_pdf_page(input_pdf_path, page_num, output_pdf_path):
    reader = PdfReader(input_pdf_path)
    writer = PdfWriter()

    writer.add_page(reader.pages[page_num - 1])  # Page numbers are 0-indexed in PyPDF2

    with open(output_pdf_path, "wb") as output_pdf:
        writer.write(output_pdf)
