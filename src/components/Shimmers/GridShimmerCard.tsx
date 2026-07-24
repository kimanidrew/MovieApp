export const GridShimmerCard = () => (
  <div className="shimmer-card">
    <div className="shimmer-thumbnail" />
    <div className="shimmer-text" />
    <div className="shimmer-subtext" />
    <style jsx>{`
      .shimmer-card {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
      }
      .shimmer-thumbnail {
        aspect-ratio: 16/9;
        background: linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%);
        background-size: 200% 100%;
        animation: pulse 1.5s infinite ease-in-out;
        border-radius: 12px;
      }
      .shimmer-text {
        height: 16px;
        width: 80%;
        background: #1a1a1a;
        border-radius: 4px;
      }
      .shimmer-subtext {
        height: 12px;
        width: 40%;
        background: #1a1a1a;
        border-radius: 4px;
      }
      @keyframes pulse {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
);