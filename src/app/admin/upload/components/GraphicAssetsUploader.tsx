import React, { useState } from "react";
import { ImageIcon, Loader2, Trash2 } from "lucide-react";

export default function GraphicAssetsUploader({ imageAssets, setImageAssets }: any) {
  const [imageUploading, setImageUploading] = useState(false);

  // Implement your R2 Upload logic here (extracted from original component)
  const handleDeviceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetType: "POSTER" | "BACKDROP") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      // Mocked R2 push
      const publicUrl = URL.createObjectURL(file); // Replace with uploadToR2
      const currentCount = imageAssets.filter((img: any) => img.type === targetType).length;
      setImageAssets([...imageAssets, { url: publicUrl, type: targetType, displayOrder: currentCount }]);
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div className="panel-card-glass">
      <h3 style={{ fontSize: "0.8rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.5rem 0" }}>Graphic Assets & Mockups</h3>
      
      <div className="image-uploader-grid">
        <div className="mini-device-uploader">
          <input type="file" accept="image/*" disabled={imageUploading} onChange={(e) => handleDeviceImageUpload(e, "POSTER")} className="hidden-native-input" />
          <ImageIcon style={{ width: "1.25rem", height: "1.25rem", color: "#38bdf8", marginBottom: "0.25rem" }} />
          <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>Upload Poster to R2</div>
        </div>
        <div className="mini-device-uploader">
          <input type="file" accept="image/*" disabled={imageUploading} onChange={(e) => handleDeviceImageUpload(e, "BACKDROP")} className="hidden-native-input" />
          <ImageIcon style={{ width: "1.25rem", height: "1.25rem", color: "#c084fc", marginBottom: "0.25rem" }} />
          <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>Upload Backdrop to R2</div>
        </div>
      </div>

      {imageUploading && <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.75rem", color: "#a1a1aa", marginTop: "1rem" }}><Loader2 style={{ width: "0.9rem", height: "0.9rem", animation: "spin 1s linear infinite" }} /> Uploading...</div>}

      {imageAssets.length > 0 && (
        <div className="gallery-display-matrix">
          {imageAssets.map((img: any, i: number) => (
            <div key={i} className="gallery-card-item">
              <img src={img.url} className="asset-preview-render" alt="Preview item" />
              <button type="button" onClick={() => setImageAssets(imageAssets.filter((_: any, idx: number) => idx !== i))} className="delete-overlay"><Trash2 style={{ width: "0.85rem", height: "0.85rem" }} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}