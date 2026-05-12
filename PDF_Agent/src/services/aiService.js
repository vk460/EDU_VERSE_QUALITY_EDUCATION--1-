export const generateAnswer = async (userQuery, pdfContextText = null, action = null) => {
  try {
    const response = await fetch("http://localhost:8000/api/chat/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_query: userQuery,
        pdf_context: pdfContextText,
        action: action
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend API Error ${response.status}:`, errorText);
      let errorMsg = `Error hitting Backend API (Status: ${response.status})`;
      try {
        const errorData = JSON.parse(errorText);
        errorMsg = errorData.error || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    const result = await response.json();
    return result.answer;
  } catch (error) {
    if (error.message && error.message.includes('Status:')) {
      throw error;
    }
    console.error('Fetch Error hitting Backend API:', error);
    throw new Error(`Error: ${error.message || "Unknown error"}`);
  }
}
