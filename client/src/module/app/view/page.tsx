"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.scss";
const Page = () => {
  const [imageUrl, setImageUrl] = useState("");

  const bucketName = "mybucket"; // Replace with your actual bucket name
  const fileName = "1727503787247_prscge[[.jpg";
  useEffect(() => {
    // Construct the URL for the existing image
    const url = `http://localhost:9000/${bucketName}/${fileName}`; // Ensure to use the correct MinIO endpoint
    setImageUrl(url);

    console.log(url);
  }, [bucketName, fileName]);
  return (
    <div>
      <h1>Image fetching sample minIo</h1>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Uploaded Image"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      ) : (
        <p>Loading image...</p>
      )}
    </div>
  );
};

export default Page;
