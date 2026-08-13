import { forwardRef, type RefObject } from "react";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { type AuthUser } from "@/lib/auth-context";
import { initials, memberDisplayLabel, memberId, profileImageSrc } from "@/components/id-card-data";

interface IdCardPdfProps {
  user: AuthUser;
  qrRef: RefObject<HTMLCanvasElement | null>;
}

export const IdCardPdf = forwardRef<HTMLDivElement, IdCardPdfProps>(function IdCardPdf({ user, qrRef }, ref) {
  return (
    <div
      ref={ref}
      data-id-card-pdf
      style={{
        position: "relative",
        width: "720px",
        height: "500px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "2px solid rgba(234, 88, 12, 0.3)",
        borderRadius: "24px",
        backgroundColor: "#ffffff",
        color: "#431407",
        boxShadow: "0 18px 45px -20px rgba(124, 45, 18, 0.55)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          height: "132px",
          flexShrink: 0,
          boxSizing: "border-box",
          padding: "22px 28px",
          borderBottom: "4px solid #ea580c",
          background: "linear-gradient(90deg, #ea580c, #f59e0b)",
          color: "#ffffff",
        }}
      >
        <BrandLogo
          loading="eager"
          sizes="88px"
          className=""
          style={{ width: "88px", height: "88px", borderRadius: "9999px", backgroundColor: "#ffffff", objectFit: "contain" }}
        />
        <div>
          <p style={{ margin: 0, fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: "28px", fontWeight: 800, lineHeight: 1.35, letterSpacing: "0.04em" }}>MAHAKAL SANATAN</p>
          <p style={{ margin: 0, fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: "28px", fontWeight: 800, lineHeight: 1.35, letterSpacing: "0.04em" }}>RAKSHA FOUNDATION</p>
          <p style={{ margin: "8px 0 0", fontSize: "12px", fontWeight: 600, lineHeight: 1.4, letterSpacing: "3px", textTransform: "uppercase" }}>
            Member identity card
          </p>
        </div>
      </div>
      <div style={{ position: "relative", flex: 1, minHeight: 0, boxSizing: "border-box", padding: "28px 32px 84px", overflow: "visible" }}>
        <div style={{ position: "absolute", right: "-64px", top: "80px", width: "224px", height: "224px", border: "18px solid rgba(234, 88, 12, 0.04)", borderRadius: "9999px" }} aria-hidden="true" />
        <div style={{ position: "absolute", left: "-80px", top: "144px", width: "192px", height: "192px", border: "14px solid rgba(234, 88, 12, 0.04)", borderRadius: "9999px" }} aria-hidden="true" />
        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "minmax(0, 1fr) 220px", alignItems: "start", gap: "28px", minHeight: "260px" }}>
          <div style={{ display: "flex", minWidth: 0, flexDirection: "row", alignItems: "flex-start", gap: "24px" }}>
            <div style={{ display: "flex", width: "140px", height: "176px", flexShrink: 0, alignItems: "center", justifyContent: "center", overflow: "hidden", border: "4px solid #ffffff", borderRadius: "12px", backgroundColor: "rgba(234, 88, 12, 0.1)", color: "#9a3412", fontSize: "36px", fontWeight: 700, boxShadow: "0 10px 15px -3px rgba(124, 45, 18, 0.2)" }}>
              {profileImageSrc(user.profileImageUrl) ? <img src={profileImageSrc(user.profileImageUrl)!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(user.name)}
            </div>
            <div style={{ minWidth: 0, flex: 1, overflow: "visible", textAlign: "left" }}>
              <h3 style={{ margin: 0, overflow: "visible", fontSize: "28px", fontWeight: 800, lineHeight: 1.35, overflowWrap: "anywhere" }}>{user.name}</h3>
               <p style={{ margin: "4px 0 0", color: "#9a3412", fontSize: "18px", fontWeight: 500, lineHeight: 1.5 }}>{memberDisplayLabel(user)}</p>
              <div style={{ marginTop: "20px", maxWidth: "320px", borderTop: "1px solid rgba(124, 45, 18, 0.15)", paddingTop: "16px", fontSize: "18px", lineHeight: 1.5 }}>
                <p style={{ margin: 0, overflow: "visible", overflowWrap: "anywhere" }}><strong>Member ID:</strong> {memberId(user)}</p>
                <p style={{ margin: 0, overflow: "visible", overflowWrap: "anywhere" }}><strong>Email:</strong> {user.email}</p>
                {user.phone && <p style={{ margin: 0, overflow: "visible", overflowWrap: "anywhere" }}><strong>Phone:</strong> {user.phone}</p>}
                 <p style={{ margin: 0, overflow: "visible", overflowWrap: "anywhere" }}><strong>Status:</strong> {memberDisplayLabel(user)}</p>
              </div>
            </div>
          </div>
          <div style={{ minWidth: 0, overflow: "visible", borderLeft: "2px dashed rgba(124, 45, 18, 0.15)", paddingLeft: "28px", textAlign: "center" }}>
            <p style={{ margin: "0 0 8px", color: "#9a3412", fontSize: "12px", fontWeight: 700, letterSpacing: "3px", lineHeight: 1.4, textTransform: "uppercase" }}>Scan to verify</p>
            <div style={{ width: "184px", height: "184px", boxSizing: "border-box", margin: "0 auto", borderRadius: "12px", backgroundColor: "#ffffff", padding: "8px", boxShadow: "0 4px 6px -1px rgba(124, 45, 18, 0.16)", outline: "1px solid rgba(124, 45, 18, 0.1)" }}>
              <canvas ref={qrRef} style={{ display: "block", width: "100%", height: "100%" }} aria-label="Member QR code" />
            </div>
            <p style={{ margin: "8px 0 0", color: "#9a3412", fontSize: "10px", lineHeight: 1.4 }}>Member verification QR</p>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: "-32px", display: "flex", width: "calc(100% + 64px)", height: "56px", boxSizing: "border-box", alignItems: "center", justifyContent: "center", gap: "10px", backgroundColor: "#ea580c", color: "#ffffff", fontSize: "20px", fontWeight: 700, lineHeight: 1.4 }}>
          <ShieldCheck style={{ width: "20px", height: "20px", flexShrink: 0 }} />
          <span>{memberId(user)}</span>
        </div>
      </div>
    </div>
  );
});