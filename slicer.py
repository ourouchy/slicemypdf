from PyPDF2 import PdfReader, PdfWriter

def split_pdf(input_pdf_path, start_page, end_page, output_pdf_path):
    reader = PdfReader(input_pdf_path)
    writer = PdfWriter()

    for i in range(start_page - 1, end_page):
        writer.add_page(reader.pages[i])

    with open(output_pdf_path, "wb") as output_pdf:
        writer.write(output_pdf)
