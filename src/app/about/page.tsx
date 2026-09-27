import React from "react";

export const metadata={title:"About Tidpix",description:"Tidpix — Authentically African Movies."};

export default function AboutPage(){
 const features=[
  {title:"African Stories",text:"A home for authentic stories made by African filmmakers and storytellers."},
  {title:"Discover Cinema",text:"Explore movies from Kenya and across the continent, with rich details about the people behind each film."},
  {title:"Watch Your Way",text:"Find something new, save movies to your collection and enjoy a focused cinematic viewing experience."}
 ];
 return <main style={{minHeight:"100vh",background:"#070707",color:"#fff"}}>
  <div className="animate-in" style={{padding:"12rem 4% 8rem",display:"flex",flexDirection:"column",alignItems:"center"}}>
   <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:24,color:"#f4b400",fontWeight:800,letterSpacing:".08em",textTransform:"uppercase"}}><span style={{width:10,height:10,borderRadius:"50%",background:"#f4b400"}}/>Tidpix</div>
   <h1 style={{fontSize:"clamp(3rem,7vw,5.5rem)",fontWeight:800,marginBottom:"1.5rem",background:"linear-gradient(to right,#f4b400,#e68a00)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",textAlign:"center",letterSpacing:"-2px"}}>Authentically African Movies</h1>
   <p style={{maxWidth:"820px",fontSize:"1.2rem",lineHeight:1.8,color:"#aaa",textAlign:"center",marginBottom:"4rem"}}>Tidpix is a destination for African cinema — connecting audiences with authentic films, filmmakers and stories from across the continent.</p>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"1.25rem",width:"100%",maxWidth:"1100px"}}>
    {features.map(f=><div key={f.title} className="hover-card" style={{background:"rgba(255,255,255,.035)",padding:"2.25rem",borderRadius:"18px",border:"1px solid rgba(244,180,0,.14)",transition:"transform .3s ease,border-color .3s ease"}}><h3 style={{fontSize:"1.35rem",marginBottom:".8rem",color:"#f4b400"}}>{f.title}</h3><p style={{color:"#999",lineHeight:1.7}}>{f.text}</p></div>)}
   </div>
  </div>
  <style>{`.hover-card:hover{transform:translateY(-8px);border-color:rgba(244,180,0,.45)!important}`}</style>
 </main>;
}