import sys
import pdfplumber

def test_extract(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        text = "\n".join([page.extract_text() for page in pdf.pages])
        print(text[:500])
        print("----- END PREVIEW -----")

if __name__ == "__main__":
    test_extract('c:/Users/mkava/Desktop/projects/Auto_Marks/automarks_BE/data/raw/1386d783-738f-47b1-b5d2-f72adfab4380_23_24.pdf')
