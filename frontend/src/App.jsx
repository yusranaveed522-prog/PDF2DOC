import { useState } from "react";
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  Upload,
  X,
} from "lucide-react";

function App() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (selectedFile) => {
    setError("");
    setConverted(false);

    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File must be smaller than 10 MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleInput = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const removeFile = () => {
    setFile(null);
    setConverted(false);
    setError("");
  };

  const convertToWord = async () => {
    if (!file) return;

    setConverting(true);
    setConverted(false);
    setError("");

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "Conversion failed.";

        try {
          const data = await response.json();
          message = data.message || message;
        } catch {}

        throw new Error(message);
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${file.name.replace(/\.pdf$/i, "")}.docx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setConverted(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setConverting(false);
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          width: 100% !important;
          min-width: 100% !important;
          max-width: none !important;
          min-height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        body {
          display: block !important;
          background: #fff8f1 !important;
        }

        button,
        input {
          font-family: inherit;
        }

        .pdf-app {
          min-height: 100vh;
          width: 100%;
          overflow: hidden;
          background: #fff8f1;
          color: #17152a;
          font-family: Inter, Arial, sans-serif;
        }

        .topbar {
          height: 76px;
          border-bottom: 2px solid #17152a;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 6%;
          background: #fff8f1;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 21px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .brand-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #17152a;
          color: #72f2c2;
          border-radius: 12px;
        }

        .brand-two {
          color: #ff5c5c;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .status-dot {
          width: 9px;
          height: 9px;
          background: #72f2c2;
          border-radius: 50%;
        }

        .hero {
          position: relative;
          min-height: calc(100vh - 76px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
        }

        .shape {
          position: absolute;
          pointer-events: none;
        }

        .shape-one {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: #72f2c2;
          left: -70px;
          top: 90px;
        }

        .shape-two {
          width: 210px;
          height: 210px;
          border-radius: 50%;
          background: #ffb38a;
          right: -80px;
          bottom: 70px;
        }

        .shape-three {
          width: 42px;
          height: 42px;
          background: #ff5c5c;
          transform: rotate(12deg);
          right: 15%;
          top: 15%;
        }

        .content {
          width: 100%;
          max-width: 900px;
          position: relative;
          z-index: 2;
        }

        .heading {
          text-align: center;
          margin-bottom: 42px;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          padding: 9px 17px;
          border-radius: 30px;
          background: #72f2c2;
          border: 2px solid #17152a;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1px;
          margin-bottom: 20px;
          box-shadow: 3px 3px 0 #17152a;
        }

        .heading h1 {
          margin: 0;
          font-size: clamp(48px, 8vw, 88px);
          line-height: 0.9;
          letter-spacing: -5px;
          font-weight: 950;
        }

        .coral {
          color: #ff5c5c;
        }

        .heading-sub {
          margin-top: 18px;
          font-size: 15px;
          font-weight: 700;
          color: rgba(23, 21, 42, 0.5);
        }

        .converter {
          background: white;
          border: 3px solid #17152a;
          border-radius: 28px;
          padding: 12px;
          box-shadow: 10px 10px 0 #17152a;
        }

        .drop-zone {
          min-height: 430px;
          border: 2px dashed rgba(23, 21, 42, 0.25);
          border-radius: 21px;
          background: #fff8f1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.25s ease;
        }

        .drop-zone.dragging {
          background: #fff0ec;
          border-color: #ff5c5c;
          transform: scale(1.01);
        }

        .upload-content {
          text-align: center;
          padding: 40px 20px;
        }

        .upload-icon {
          width: 105px;
          height: 105px;
          margin: 0 auto 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ff5c5c;
          color: white;
          border-radius: 30px;
          box-shadow: 8px 8px 0 #72f2c2;
          transition: 0.3s ease;
        }

        .upload-icon:hover {
          transform: rotate(4deg) scale(1.05);
        }

        .upload-content h2 {
          margin: 0;
          font-size: clamp(26px, 4vw, 38px);
          font-weight: 950;
          letter-spacing: -1.5px;
        }

        .upload-content p {
          margin: 10px 0 0;
          color: rgba(23, 21, 42, 0.45);
          font-weight: 650;
        }

        .choose-button {
          margin-top: 28px;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 15px 25px;
          border: 0;
          border-radius: 12px;
          background: #17152a;
          color: white;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .choose-button:hover {
          background: #ff5c5c;
          transform: translateY(-2px);
        }

        .choose-button input {
          display: none;
        }

        .error {
          margin-top: 18px;
          color: #ff5c5c;
          font-size: 14px;
          font-weight: 800;
        }

        .file-content {
          width: 100%;
          padding: 45px;
          text-align: center;
        }

        .file-icon {
          width: 100px;
          height: 100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 27px;
          background: #ffb38a;
          color: #17152a;
        }

        .file-icon.success {
          background: #72f2c2;
        }

        .file-name {
          margin: 22px auto 0;
          max-width: 600px;
          overflow-wrap: anywhere;
          font-size: 21px;
          font-weight: 900;
        }

        .file-size {
          margin-top: 5px;
          font-size: 13px;
          font-weight: 700;
          color: rgba(23, 21, 42, 0.4);
        }

        .conversion-line {
          display: flex;
          align-items: center;
          gap: 15px;
          margin: 38px 0;
        }

        .line {
          height: 2px;
          flex: 1;
          background: rgba(23, 21, 42, 0.1);
        }

        .format {
          padding: 12px 20px;
          border-radius: 30px;
          background: #17152a;
          color: white;
          font-size: 13px;
          font-weight: 900;
        }

        .format-arrow {
          color: #ff5c5c;
          margin: 0 8px;
        }

        .docx {
          color: #72f2c2;
        }

        .progress {
          margin-bottom: 25px;
        }

        .progress-bar {
          height: 10px;
          background: rgba(23, 21, 42, 0.1);
          border-radius: 20px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          width: 65%;
          background: #ff5c5c;
          animation: pulse 1s infinite alternate;
        }

        @keyframes pulse {
          from {
            width: 35%;
          }
          to {
            width: 75%;
          }
        }

        .progress-text {
          margin-top: 8px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          color: rgba(23, 21, 42, 0.4);
        }

        .success-message {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 13px;
          margin-bottom: 22px;
          background: #72f2c2;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 900;
        }

        .actions {
          display: flex;
          gap: 12px;
        }

        .remove-button,
        .convert-button {
          min-height: 54px;
          border-radius: 12px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .remove-button {
          padding: 0 20px;
          background: white;
          border: 2px solid #17152a;
          color: #17152a;
        }

        .remove-button:hover {
          background: #ffb38a;
        }

        .convert-button {
          flex: 1;
          border: 2px solid #17152a;
          background: #ff5c5c;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 4px 4px 0 #17152a;
        }

        .convert-button:hover {
          background: #17152a;
          box-shadow: 6px 6px 0 #72f2c2;
          transform: translateY(-2px);
        }

        .convert-button:disabled,
        .remove-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .bottom-text {
          margin-top: 28px;
          text-align: center;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(23, 21, 42, 0.35);
        }

        .bottom-text span {
          margin: 0 8px;
        }

        .bottom-text span:nth-child(1) {
          color: #ff5c5c;
        }

        .bottom-text span:nth-child(2) {
          color: #72f2c2;
        }

        .bottom-text span:nth-child(3) {
          color: #ffb38a;
        }

        @media (max-width: 650px) {
          .topbar {
            padding: 0 20px;
          }

          .status {
            display: none;
          }

          .hero {
            padding: 45px 15px;
          }

          .heading h1 {
            letter-spacing: -3px;
          }

          .converter {
            box-shadow: 6px 6px 0 #17152a;
          }

          .drop-zone {
            min-height: 390px;
          }

          .file-content {
            padding: 30px 18px;
          }

          .actions {
            flex-direction: column;
          }

          .remove-button {
            width: 100%;
          }

          .shape-one {
            left: -100px;
          }

          .shape-two {
            right: -110px;
          }
        }
      `}</style>

      <div className="pdf-app">

        <header className="topbar">
          <div className="brand">
            <div className="brand-icon">
              <FileText size={22} />
            </div>

            <span>
              PDF<span className="brand-two">2</span>DOC
            </span>
          </div>

          <div className="status">
            <span className="status-dot" />
            Ready
          </div>
        </header>

        <main className="hero">

          <div className="shape shape-one" />
          <div className="shape shape-two" />
          <div className="shape shape-three" />

          <div className="content">

            <section className="heading">

              <div className="pill">
                PDF → DOCX
              </div>

              <h1>
                Convert
                <span className="coral"> PDF </span>
                to Word.
              </h1>

              <div className="heading-sub">
                Simple PDF conversion.
              </div>

            </section>

            <section className="converter">

              <div
                className={`drop-zone ${dragging ? "dragging" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >

                {!file ? (
                  <div className="upload-content">

                    <div className="upload-icon">
                      <Upload size={45} />
                    </div>

                    <h2>Drop your PDF</h2>

                    <p>or choose a file</p>

                    <label className="choose-button">
                      <Upload size={18} />
                      Choose PDF

                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleInput}
                      />
                    </label>

                    {error && (
                      <div className="error">
                        {error}
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="file-content">

                    <div
                      className={`file-icon ${
                        converted ? "success" : ""
                      }`}
                    >
                      {converted ? (
                        <Check size={45} strokeWidth={3} />
                      ) : (
                        <FileText size={45} />
                      )}
                    </div>

                    <div className="file-name">
                      {file.name}
                    </div>

                    <div className="file-size">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </div>

                    <div className="conversion-line">
                      <div className="line" />

                      <div className="format">
                        PDF
                        <span className="format-arrow">→</span>
                        <span className="docx">DOCX</span>
                      </div>

                      <div className="line" />
                    </div>

                    {converting && (
                      <div className="progress">
                        <div className="progress-bar">
                          <div className="progress-fill" />
                        </div>

                        <div className="progress-text">
                          Converting...
                        </div>
                      </div>
                    )}

                    {converted && !converting && (
                      <div className="success-message">
                        <Check size={18} />
                        Conversion complete
                      </div>
                    )}

                    {error && (
                      <div className="error">
                        {error}
                      </div>
                    )}

                    <div className="actions">

                      <button
                        className="remove-button"
                        onClick={removeFile}
                        disabled={converting}
                      >
                        <X size={17} />
                        Remove
                      </button>

                      <button
                        className="convert-button"
                        onClick={convertToWord}
                        disabled={converting}
                      >
                        {converting ? (
                          <>
                            <span>Converting...</span>
                          </>
                        ) : (
                          <>
                            <Download size={18} />
                            {converted
                              ? "Convert Again"
                              : "Convert to Word"}
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>

                    </div>

                  </div>
                )}

              </div>
            </section>

            <div className="bottom-text">
              <span>Fast</span>
              •
              <span>Free</span>
              •
              <span>Simple</span>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}

export default App;
