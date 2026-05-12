import { useState } from "react";
import axios from "axios";

function Upload() {
  const [file, setFile] = useState(null);

  const uploadPDF = async () => {
    if (!file) return alert("Select a file");

    const formData = new FormData();
    formData.append("file", file);

    await axios.post("http://localhost:8000/upload/", formData);
    alert("PDF uploaded!");
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={uploadPDF}>Upload</button>
    </div>
  );
}

export default Upload;