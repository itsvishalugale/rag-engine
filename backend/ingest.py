import os
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

DATA_PATH = "data/pdfs"
DB_PATH = "vectorstore/db"


def ingest_documents():
    documents = []

    # Load all PDFs
    for file in os.listdir(DATA_PATH):
        if file.endswith(".pdf"):
            loader = PyPDFLoader(os.path.join(DATA_PATH, file))
            documents.extend(loader.load())

    # 🔥 Balanced chunking (accuracy + speed)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=200
    )

    chunks = splitter.split_documents(documents)

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vectorstore = FAISS.from_documents(chunks, embeddings)

    os.makedirs(DB_PATH, exist_ok=True)
    vectorstore.save_local(DB_PATH)

    print(f"✅ Ingested {len(chunks)} chunks successfully")


if __name__ == "__main__":
    ingest_documents()
