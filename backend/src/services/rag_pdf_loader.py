from sentence_transformers import SentenceTransformer
from chromadb import HttpClient
from langchain.text_splitter import RecursiveCharacterTextSplitter
from pathlib import Path
import os

# Initialize ChromaDB REST client
client = HttpClient(host="localhost", port=8000)

COLLECTION_NAME = "legal_rag_chunks"
model = SentenceTransformer("all-MiniLM-L6-v2")

# Configure text splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)

def get_all_markdowns(md_root_dir: str):
    """
    Recursively collects all .md files from the directory.
    """
    md_dir_path = Path(md_root_dir)
    if not md_dir_path.exists():
        raise FileNotFoundError(f"The provided directory does not exist: {md_root_dir}")

    md_files = list(md_dir_path.rglob("*.md"))
    print(f"📂 Scanning directory: {md_root_dir}")
    print(f"📄 Found {len(md_files)} markdown file(s)")

    return md_files

def extract_text_chunks_from_mds(md_paths):
    chunks = []
    for md_path in md_paths:
        filename = os.path.basename(md_path)
        print(f"📄 Reading: {filename}")

        try:
            with open(md_path, "r", encoding="utf-8") as f:
                text = f.read()

            print(f"📝 {filename} has {len(text)} characters")

            md_chunks = text_splitter.split_text(text)
            valid_chunks = [chunk.strip() for chunk in md_chunks if chunk.strip()]
            chunks.extend(valid_chunks)

            print(f"🧩 {filename} split into {len(valid_chunks)} chunks")

        except Exception as e:
            print(f"⚠️ Error reading {filename}: {e}")

    print(f"🧠 Total valid chunks extracted: {len(chunks)}")
    return chunks

def build_vector_db(md_dir):
    print("🚀 Starting vector DB build...")
    md_paths = get_all_markdowns(md_dir)
    chunks = extract_text_chunks_from_mds(md_paths)

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
    SCRIPT_DIR = Path(__file__).resolve().parent
    PROJECT_ROOT = SCRIPT_DIR.parent.parent
    MD_DIR = PROJECT_ROOT / "rag_documents"

    try:
        build_vector_db(str(MD_DIR))
    except FileNotFoundError as e:
        print(f"❌ {e}")
