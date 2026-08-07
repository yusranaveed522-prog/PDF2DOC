import sys
import pymupdf
from docx import Document


def convert_pdf_to_docx(pdf_path, docx_path):
    pdf = pymupdf.open(pdf_path)
    document = Document()

    for page in pdf:
        text = page.get_text()

        if text.strip():
            document.add_paragraph(text)

    document.save(docx_path)
    pdf.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert.py input.pdf output.docx")
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_docx = sys.argv[2]

    convert_pdf_to_docx(input_pdf, output_docx)

    print(f"Conversion successful: {output_docx}")