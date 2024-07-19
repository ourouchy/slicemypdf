from flask import Flask, request, redirect, url_for, send_file, render_template
from werkzeug.utils import secure_filename
import os
from slicer import split_pdf
from extract import extract_pdf_page

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['DOWNLOAD_FOLDER'] = 'downloads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['DOWNLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/slice', methods=['POST'])
def slice_pdf():
    if 'file' not in request.files:
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        return redirect(request.url)
    
    if file:
        filename = secure_filename(file.filename)
        input_pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(input_pdf_path)

        start_page = int(request.form['start_page'])
        end_page = int(request.form['end_page'])
        output_filename = f"sliced_{filename}"
        output_pdf_path = os.path.join(app.config['DOWNLOAD_FOLDER'], output_filename)

        split_pdf(input_pdf_path, start_page, end_page, output_pdf_path)

        return send_file(output_pdf_path, as_attachment=True)

@app.route('/extract', methods=['POST'])
def extract_page():
    if 'file' not in request.files or 'page_num' not in request.form:
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        return redirect(request.url)
    
    if file:
        filename = secure_filename(file.filename)
        input_pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(input_pdf_path)

        page_num = int(request.form['page_num'])
        output_filename = f"extracted_page_{page_num}_{filename}"
        output_pdf_path = os.path.join(app.config['DOWNLOAD_FOLDER'], output_filename)

        extract_pdf_page(input_pdf_path, page_num, output_pdf_path)
        return send_file(output_pdf_path, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)
