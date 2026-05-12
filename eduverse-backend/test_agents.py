import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8001"

def test_root():
    print("\n--- Testing Root ---")
    try:
        resp = requests.get(f"{BASE_URL}/")
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json()}")
    except Exception as e:
        print(f"Error: {e}")

def test_aptitude():
    print("\n--- Testing Aptitude Agent ---")
    try:
        resp = requests.get(f"{BASE_URL}/api/aptitude/question?topic=quant")
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("Successfully got a question.")
        else:
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

def test_email_generate():
    print("\n--- Testing Email Generation ---")
    payload = {
        "sender_name": "Test User",
        "sender_email": "test@example.com",
        "receiver_email": "receiver@example.com",
        "prompt": "Write a thank you email for a job interview."
    }
    try:
        resp = requests.post(f"{BASE_URL}/api/email/generate", json=payload)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("Successfully generated email.")
        else:
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

def test_pdf_chat():
    print("\n--- Testing PDF Chat ---")
    payload = {
        "user_query": "What is the main topic?",
        "pdf_context": "This is a dummy PDF context about Artificial Intelligence."
    }
    try:
        resp = requests.post(f"{BASE_URL}/api/pdf/chat", json=payload)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("Successfully chatted with PDF.")
        else:
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

def test_comms_ask():
    print("\n--- Testing Comms Agent (AI Ask) ---")
    payload = {
        "text": "Hello, who are you?",
        "mode": "chat"
    }
    try:
        resp = requests.post(f"{BASE_URL}/api/comms/ask", json=payload)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print(f"AI Response: {resp.json().get('text')}")
        else:
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

def test_research_generate():
    print("\n--- Testing Research Agent ---")
    payload = {
        "topic": "Machine Learning",
        "action": "outline"
    }
    try:
        resp = requests.post(f"{BASE_URL}/api/research/generate", json=payload)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("Successfully generated research outline.")
        else:
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_root()
    test_aptitude()
    test_email_generate()
    test_pdf_chat()
    test_comms_ask()
    test_research_generate()
