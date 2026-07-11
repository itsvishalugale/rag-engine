import os
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

load_dotenv()

DB_PATH = "vectorstore/db"


def get_rag_chain():

    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

    # Auto-initialize placeholder database if it doesn't exist to prevent crash on startup
    if not os.path.exists(os.path.join(DB_PATH, "index.faiss")):
        os.makedirs(DB_PATH, exist_ok=True)
        vectorstore = FAISS.from_texts(
            ["No documents uploaded yet. Please upload PDF documents to start chatting."],
            embeddings
        )
        vectorstore.save_local(DB_PATH)
    else:
        vectorstore = FAISS.load_local(
            DB_PATH,
            embeddings,
            allow_dangerous_deserialization=True
        )

    # 🔥 Base retriever (fast default)
    base_retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

    # 🔥 Smart LLM config (balanced)
    llm = ChatGoogleGenerativeAI(
        model="gemini-3.5-flash",
        temperature=0.2,
        streaming=True
    )

    prompt = PromptTemplate.from_template(
        """
You are an intelligent AI assistant.

If relevant information exists in the context, prioritize it.
If context is insufficient, use general knowledge to provide
a correct and helpful answer.

Keep answers clear and concise.

Context:
{context}

Question:
{question}

Answer:
"""
    )

    # 🔥 Dynamic Retrieval (Smart Depth Control)
    def dynamic_retrieval(question: str):

        word_count = len(question.split())

        # Complex questions → deeper search
        if word_count > 20:
            retriever = vectorstore.as_retriever(search_kwargs={"k": 6})
        else:
            retriever = base_retriever

        docs = retriever.invoke(question)

        if not docs:
            return "No relevant document context found."

        # 🔥 Context trimming (prevents slowdown)
        combined_context = "\n\n".join(doc.page_content for doc in docs)

        return combined_context[:4000]  # limit context size

    rag_chain = (
        {
            "context": RunnableLambda(dynamic_retrieval),
            "question": RunnablePassthrough()
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain
