import sys
import os

file_path = r'd:\Eduverse-The Final Project\eduverse-frontend\public\comms\js\modules\ui.js'

if not os.path.exists(file_path):
    print(f"Error: {file_path} not found")
    sys.exit(1)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update import
old_import = "import { areVoicesReady } from './speech.js';"
new_import = "import { areVoicesReady, speak } from './speech.js';"
if old_import in content:
    content = content.replace(old_import, new_import)
    print("Updated import")
else:
    print("Import already updated or not found")

# 2. Update speak function call
# Using a more flexible match for whitespace
import re
pattern_call = r'// Speak the response\s+speakText\(aiText\);'
replacement_call = '// Speak the response using the unified speak function (handles lip-sync)\n        speak(aiText);'
if re.search(pattern_call, content):
    content = re.sub(pattern_call, replacement_call, content)
    print("Updated speak call")
else:
    print("Speak call already updated or not found")

# 3. Remove speakText function
pattern_func = r'// Browser TTS - speak text without socket\.io\s+export function speakText\(text\) \{[\s\S]*?\}'
if re.search(pattern_func, content):
    content = re.sub(pattern_func, '', content)
    print("Removed speakText function")
else:
    print("speakText function already removed or not found")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated ui.js")
