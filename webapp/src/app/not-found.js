"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NotFound() {
  const router = useRouter();
  const [segundos, setSegundos] = useState(5);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) {
          clearInterval(intervalo);
          router.push("/");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalo);
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f0f14",
      color: "#fff",
      fontFamily: "system-ui, sans-serif",
      textAlign: "center",
      padding: "24px",
    }}>
      <img
        src="/logou.png"
        alt="USPG"
        style={{ width: 120, marginBottom: 32, opacity: 0.9 }}
      />

      <div style={{
        fontSize: 96,
        fontWeight: 800,
        color: "#800020",
        lineHeight: 1,
        marginBottom: 8,
      }}>
        404
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, color: "#e5e5e5" }}>
        Página no encontrada
      </h1>

      <p style={{ color: "#888", fontSize: 15, marginBottom: 32, maxWidth: 380 }}>
        La ruta que buscas no existe. Serás redirigido al inicio en{" "}
        <span style={{ color: "#800020", fontWeight: 700 }}>{segundos}</span>{" "}
        {segundos === 1 ? "segundo" : "segundos"}.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" style={{
          background: "#800020",
          color: "#fff",
          padding: "10px 24px",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 14,
        }}>
          Ir al inicio
        </Link>
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent",
            color: "#aaa",
            border: "1px solid #333",
            padding: "10px 24px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Volver atrás
        </button>
      </div>
    </div>
  );
}
