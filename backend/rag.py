from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

DB_PATH = "vectorstore/db"


def get_rag_chain():

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vectorstore = FAISS.load_local(
        DB_PATH,
        embeddings,
        allow_dangerous_deserialization=True
    )

    # 🔥 Base retriever (fast default)
    base_retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

    # 🔥 Smart LLM config (balanced)
    llm = OllamaLLM(
        model="phi",
        temperature=0.2,
        top_p=0.9,
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
