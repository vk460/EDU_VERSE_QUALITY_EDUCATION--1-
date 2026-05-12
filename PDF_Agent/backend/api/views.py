from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from groq import Groq

SYSTEM_PROMPT = """You are an intelligent AI assistant designed for answering user questions using a Retrieval-Augmented Generation (RAG) system. We use RAG architecture where Groq acts as the reasoning layer to generate context-aware answers from PDF and external sources.

## 🎯 Your Responsibilities
1. (Primary Source): PDF documents
2. (Secondary Source): Internet search (if enabled)
3. General LLM knowledge

---

## 🎨 Linguistic Style Mirroring (CRITICAL)
- **Mirror the Source**: Your output must adopt the tone, vocabulary, and linguistic complexity of the provided PDF context. 
- **Terminology**: Use the exact same technical terms and definitions found in the document.
- **Consistency**: If the PDF is formal and academic, stay formal. If it is technical and concise, match that style.

---

## 📂 Retrieval Rules (STRICT ORDER)

1. FIRST: Search the context provided.
   - Look for page markers like `[PAGE:n]` within the text.
   - If relevant context is found → answer ONLY from PDF
   - Do NOT hallucinate or add external knowledge
   - IMPORTANT: Make sure that the language of the answer and the language from the PDF will be nearly the same.
   - **CITE THE PAGE**: In your "Source" section, you must specify the exact page number(s) found in the `[PAGE:n]` markers.

2. SECOND: If the user asks a question outside the syllabus that means outside from the pdf
   - You must answer that correctly.
   - IMPORTANT: You MUST prepend your answer with the EXACT statement: "Answer from outside the pdf."

3. THIRD: If both PDF and internet fail
   - Use LLM knowledge
   - Clearly mention it is based on general knowledge

---

## 🧠 Answer Generation Rules

- **Use Markdown Formatting STRICTLY:** Always use Markdown features like **bolding** for keywords, `inline code` for technical terms, and blockquotes for excerpts.
- **Structured Layout:** Use appropriate heading levels (###, ####) to divide your answer into logical sections for easy reading.
- **Lists and Bullet Points:** Extensive use of bullet points (-) or numbered lists (1., 2.) is MANDATORY whenever presenting multiple items, steps, or related concepts. **Every bullet point must be on its own line.**
- **Extreme Spacing:** Use double newlines (\n\n) between EVERY section, every heading, and every list item to ensure maximum readability.
- **Conciseness:** Avoid long paragraphs. Break information down into small, readable chunks.
- Always prioritize accuracy over verbosity.
- Avoid repetition.

---

## 📌 Source Attribution (MANDATORY)

At the end of every answer, include:
- Source: [PDF Document (Page X) / Internet Source / LLM Knowledge]

---

## ⚠️ Hallucination Prevention
- If unsure → say "I could find this information in the PDF or reliable sources"
- NEVER fabricate facts

---

## 🧹 Clean Output Format
Answer:
<final answer mirroring the PDF style with lots of spacing>

Source:
<source details>
"""

import re

def get_relevant_context(query, context, max_chars=40000):
    if not context or len(context) <= max_chars:
        return context
    
    # 1. Split into individual documents
    doc_blocks = re.split(r'(--- DOCUMENT: .*? ---)', context)
    documents = []
    for i in range(1, len(doc_blocks), 2):
        header = doc_blocks[i]
        content = doc_blocks[i+1] if i+1 < len(doc_blocks) else ""
        documents.append((header, content))
    
    if not documents:
        return context[:max_chars]
        
    # 2. Allocate budget per document
    budget_per_doc = max_chars // len(documents)
    final_context = []
    
    keywords = re.findall(r'\w+', query.lower())
    keywords = [k for k in keywords if len(k) > 3]
    
    for header, content in documents:
        # If specific keywords exist, do RAG within this doc
        if keywords and len(content) > budget_per_doc:
            doc_budget = budget_per_doc - len(header)
            window_size = 800
            overlap = 150
            windows = [content[i:i + window_size] for i in range(0, len(content), window_size - overlap)]
            
            scored = []
            for win in windows:
                score = sum(win.lower().count(kw) for kw in keywords)
                if score > 0: scored.append((score, win))
            
            scored.sort(key=lambda x: x[0], reverse=True)
            doc_text = "\n---\n".join([w for s, w in scored[:doc_budget//window_size]])
            if not doc_text: doc_text = content[:doc_budget]
            final_context.append(f"{header}\n{doc_text}")
        else:
            # For global actions or small docs, just take the top part
            final_context.append(f"{header}\n{content[:budget_per_doc-len(header)]}")
            
    return "\n\n".join(final_context)

@method_decorator(csrf_exempt, name='dispatch')
class ChatView(APIView):
    def post(self, request):
        user_query = request.data.get('user_query')
        pdf_context = request.data.get('pdf_context')
        action = request.data.get('action')
        
        if not user_query and not action:
            return Response({"error": "user_query or action is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Define specialized prompts for INDIVIDUAL PER-DOC RESULTS
        if action == 'summarize':
            user_query = "For EACH provided document, provide a highly structured, point-wise summary labeled with the document name. Use clear headings, bullet points, and AT LEAST TWO NEWLINES between sections for proper vertical spacing. NEVER output a single block of text.\n\nFormat:\n--- RESULT FOR: [filename] ---\n\n### Overview\n\n[Brief overview]\n\n### Key Points\n\n- [Point 1]\n- [Point 2]\n\n### Conclusion\n\n[Brief conclusion]"
        elif action == 'flowchart':
            user_query = """For EACH provided document, create a SEPARATE, DETAILED hierarchical flowchart showing the main topic, sub-topics, and key concepts.

STRICT MERMAID SYNTAX RULES (Follow EXACTLY):
1. Start EVERY flowchart with: graph TD
2. Wrap ALL node text in double quotes: A["Node Text Here"]  
3. Use ONLY these arrow types: --> (solid), -.-> (dashed), ==> (thick)
4. NO special characters inside node labels: no (), [], {}, /, \, %, @, #, &
5. Replace colons with a dash: use "Input - Data" not "Input: Data"
6. Each connection on its own line: A["Start"] --> B["Process"]
7. Add subgraph boxes for major topic groups

FORMAT FOR EACH DOCUMENT:
--- RESULT FOR: [filename] ---
```mermaid
graph TD
    A["Main Topic"] --> B["Sub Topic 1"]
    A --> C["Sub Topic 2"]
    B --> D["Detail 1"]
    B --> E["Detail 2"]
    C --> F["Detail 3"]
    subgraph section1["Group Label"]
        D
        E
    end
```"""
        elif action == 'key_points':
            user_query = "For EACH provided document, extract 5 critical insights labeled with the document name. Format: --- RESULT FOR: [filename] ---\n1. Point: Explanation..."
        elif action == 'generate_questions':
            user_query = "For EACH provided document, generate a highly structured set of exam questions. You MUST use DOUBLE NEWLINES between every question and every answer so it is heavily spaced out and readable.\n\nFormat:\n--- RESULT FOR: [filename] ---\n\n### Multiple Choice Questions\n\n1. [Question Text]\n\na) [Option]\nb) [Option]\nc) [Option]\nd) [Option]\n\nAnswer: [Answer]\n\n### Short Questions\n\n1. [Question Text]\n\nAnswer: [Answer]\n\n### Long Questions\n\n1. [Question Text]\n\nAnswer: [Answer]"

        # Multi-Doc Aware Pruning
        pruned_context = get_relevant_context(user_query, pdf_context, max_chars=40000)
        
        prompt = user_query
        if pruned_context:
            prompt = f"CONTEXT FROM MULTIPLE PDF DOCUMENTS:\n{pruned_context}\n\nUSER REQUEST (Provide SEPARATE results for each document):\n{user_query}"
        
        try:
            client = Groq(api_key=settings.GROQ_API_KEY)
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=4096, # Increased for multiple results
                top_p=1,
                stream=False,
                stop=None,
            )
            
            return Response({"answer": completion.choices[0].message.content}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
