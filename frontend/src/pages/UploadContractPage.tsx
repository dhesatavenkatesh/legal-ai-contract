import axios from "axios";
import {
  CheckCircle,
  FileText,
  UploadCloud,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { uploadContract } from "../services/api";
import type { UploadContractResponse } from "../types";

function UploadContractPage() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploadResult, setUploadResult] =
    useState<UploadContractResponse | null>(null);

  const [isUploading, setIsUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    setError("");
    setUploadResult(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      setSelectedFile(null);
      setError("Please select a PDF file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSelectedFile(null);
      setError("Maximum allowed file size is 10 MB.");
      return;
    }

    setSelectedFile(file);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please select a PDF contract.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const result = await uploadContract(
        selectedFile,
      );

      setUploadResult(result);
    } catch (uploadError) {
      if (axios.isAxiosError(uploadError)) {
        setError(
          uploadError.response?.data?.detail
            ?? "Contract upload failed.",
        );
      } else {
        setError("Contract upload failed.");
      }
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Upload Contract</h2>
          <p>
            Upload a text-based PDF for legal document analysis.
          </p>
        </div>
      </div>

      <div className="upload-layout">
        <form
          className="upload-card"
          onSubmit={handleSubmit}
        >
          <label className="upload-dropzone">
            <UploadCloud size={48} />

            <strong>Select a contract PDF</strong>

            <span>
              PDF files up to 10 MB are supported
            </span>

            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />
          </label>

          {selectedFile && (
            <div className="selected-file">
              <FileText size={22} />

              <div>
                <strong>{selectedFile.name}</strong>

                <span>
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-button full-width"
            disabled={!selectedFile || isUploading}
          >
            {isUploading
              ? "Uploading and analysing..."
              : "Upload Contract"}
          </button>
        </form>

        <article className="content-card">
          <h3>Processing Workflow</h3>

          <div className="process-list">
            <span>1. Upload contract PDF</span>
            <span>2. Extract document text</span>
            <span>3. Store contract in PostgreSQL</span>
            <span>4. Generate ChromaDB embeddings</span>
            <span>5. Detect clauses and risks</span>
          </div>
        </article>
      </div>

      {uploadResult && (
        <article className="success-card">
          <CheckCircle size={28} />

          <div>
            <h3>Contract uploaded successfully</h3>

            <p>
              {uploadResult.filename} was processed and indexed.
            </p>

            <div className="success-details">
              <span>
                Text length: {uploadResult.text_length}
              </span>

              <span>
                Chunks: {uploadResult.stored_chunk_count ?? 0}
              </span>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                navigate(
                  `/contracts/${uploadResult.contract_id}`,
                )
              }
            >
              View Contract
            </button>
          </div>
        </article>
      )}
    </section>
  );
}

export default UploadContractPage;