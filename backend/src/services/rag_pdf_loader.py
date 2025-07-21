from sentence_transformers import SentenceTransformer
from chromadb import HttpClient
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os
import fitz  # PyMuPDF
from pathlib import Path

# Initialize ChromaDB REST client
client = HttpClient(host="localhost", port=8000)

COLLECTION_NAME = "legal_rag_chunks"
model = SentenceTransformer("all-MiniLM-L6-v2")

# Configure text splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)

def extract_text_chunks_from_pdfs(pdf_dir):
    chunks = []
    print(f"🔍 Looking for PDFs in: {pdf_dir}")

    for filename in os.listdir(pdf_dir):
        if filename.endswith(".pdf"):
            pdf_path = os.path.join(pdf_dir, filename)
            print(f"📄 Processing: {filename}")

            try:
                doc = fitz.open(pdf_path)
                print(f"📄 Pages: {len(doc)}")

                full_text = ""
                for page in doc:
                    text = page.get_text()
                    full_text += text + "\n"

                print(f"📄 Extracted {len(full_text)} characters")

                # Use LangChain splitter
                pdf_chunks = text_splitter.split_text(full_text)
                chunks.extend([chunk.strip() for chunk in pdf_chunks if chunk.strip()])

            except Exception as e:
                print(f"⚠️ Error processing {filename}: {e}")

    print(f"🧩 Total valid chunks: {len(chunks)}")
    return chunks

def build_vector_db(pdf_dir):
    print("📄 Starting vector DB build...")
    chunks = extract_text_chunks_from_pdfs(pdf_dir)

    if not chunks:
        print("❌ No valid chunks found. Exiting.")
        return

    embeddings = model.encode(chunks, convert_to_numpy=True)

    try:
        client.delete_collection(COLLECTION_NAME)
        print("🗑️ Existing collection deleted.")
    except:
        print("ℹ️ No existing collection to delete or deletion failed.")

    collection = client.get_or_create_collection(COLLECTION_NAME)

    collection.add(
        ids=[f"chunk_{i}" for i in range(len(chunks))],
        documents=chunks,
        embeddings=embeddings.tolist()
    )

    print(f"✅ Vector DB built with {len(chunks)} chunks.")

if __name__ == "__main__":
    # Resolve path assuming: rag_documents is a sibling of backend/
    SCRIPT_DIR = Path(__file__).resolve().parent
    PROJECT_ROOT = SCRIPT_DIR.parent.parent  # go up from backend/src/services
    PDF_DIR = Path(__file__).resolve().parents[3] / "rag_documents"

    build_vector_db(str(PDF_DIR))
