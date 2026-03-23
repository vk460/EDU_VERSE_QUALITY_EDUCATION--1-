import os
import json
from openai import OpenAI
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import EmailMessage
from django.conf import settings

# Using Groq (as indicated by your gsk_ key):
client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

@csrf_exempt
def generate_email(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # You can also pass receiver_email from your frontend if you add it to the state
            # but currently the frontend only sends email (receiver), prompt, and tone.
            receiver_email = data.get('email', '[Receiver Email]')
            tone = data.get('tone', 'Professional')
            prompt_text = data.get('prompt', '')
            
            # Extract from request payload
            sender_name = data.get('sender_name', '[Your Name]')
            sender_email = data.get('sender_email', '[Your Email]')
            sender_phone = data.get('sender_phone', '[Your Phone]')

            system_instruction = f"""
You are an AI Email Assistant.

Your task is to generate a complete, professional email using the user's details.

First, understand the user input:
- Sender Name: {sender_name}
- Sender Email: {sender_email}
- Sender Phone: {sender_phone}
- Receiver Email: {receiver_email}
- Tone: {tone}
- Message Prompt: {prompt_text}

--------------------------------------------------
STRICT INSTRUCTIONS:
1. Generate a well-structured email with Subject, Body, and greeting.
2. DO NOT repeat the prompt directly.
3. Convert the prompt into a meaningful, natural email.
4. Maintain the selected tone (Formal, Friendly, Professional).
5. Add a proper closing based on the tone.
6. Add FULL SIGNATURE using user details (Name, Email, Phone).
7. Format output EXACTLY like this:
----------------------------------------
Subject: <generated subject>

Body:
<well-written email content>

Signature:
{sender_name}
Email: {sender_email}
Phone: {sender_phone}
----------------------------------------
8. Do NOT include unnecessary explanations.
"""
            # Using Groq model
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": "Please generate the email based on the details."}
                ]
            )
            
            generated_content = response.choices[0].message.content
            
            if generated_content:
                return JsonResponse({'generated_email': generated_content})
            else:
                return JsonResponse({'error': 'No content generated'}, status=500)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def send_email(request):
    if request.method == 'POST':
        try:
            receiver = request.POST.get('receiver')
            subject = request.POST.get('subject')
            body = request.POST.get('body')
            
            if not receiver or not subject or not body:
                return JsonResponse({'error': 'Missing required fields (receiver, subject, or body)'}, status=400)

            # Subjects cannot contain newlines (RFC 2822)
            subject = ''.join(subject.splitlines()).strip()

            if not settings.EMAIL_HOST_PASSWORD or settings.EMAIL_HOST_PASSWORD == 'YOUR_16_DIGIT_APP_PASSWORD' or settings.EMAIL_HOST_USER == 'YOUR_GMAIL_ADDRESS@gmail.com':
                return JsonResponse({'error': 'Email credentials are not correctly configured. Please provide a valid 16-digit App Password for your Gmail account. Using an empty password is not allowed.'}, status=400)

            email_msg = EmailMessage(
                subject=subject,
                body=body,
                from_email=settings.EMAIL_HOST_USER,
                to=[receiver],
            )
            
            # Handle attachments
            if 'file' in request.FILES:
                uploaded_file = request.FILES['file']
                email_msg.attach(uploaded_file.name, uploaded_file.read(), uploaded_file.content_type)
                
            email_msg.send(fail_silently=False)
            
            return JsonResponse({'status': 'success', 'message': 'Email physically sent successfully!'})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Invalid request method'}, status=405)
