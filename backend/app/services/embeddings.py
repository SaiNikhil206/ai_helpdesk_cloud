from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores.pgvector import PGVector
from app.config import Config
from dotenv import load_dotenv
import os

load_dotenv()

## Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB_DIR = os.path.join(BASE_DIR, "kb")  

loader = DirectoryLoader(
    KB_DIR,
    glob="**/*.md",
    loader_cls=TextLoader,
    loader_kwargs={"encoding": "utf-8"}
)

documents = loader.load()

splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=20)
docs = splitter.split_documents(documents)

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# vectorstore = Chroma.from_documents(documents=docs, embedding=embeddings, persist_directory="chroma_db")

vectorstore = PGVector.from_documents(documents=docs, embedding=embeddings, collection_name=Config.CONNECTION_NAME, connection_string=Config.CONNECTION_PG_VECTORDB, use_jsonb=True)
