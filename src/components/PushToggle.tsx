"use client";

import { useEffect, useState } from "react";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

export default function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (!KEY) return setState("unsupported");
      if (!supported) return setState(isIOS && !standalone ? "ios-install" : "unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function turnOn() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(KEY!) }));
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setState(res.ok ? "on" : "off");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  const note: Record<State, string> = {
    loading: "",
    unsupported: "이 브라우저에서는 알림을 받을 수 없어요.",
    "ios-install": "아이폰은 공유 버튼 → '홈 화면에 추가' 후 앱으로 열면 알림을 켤 수 있어요.",
    denied: "알림이 차단돼 있어요. 휴대폰 설정에서 이 앱의 알림을 허용해 주세요.",
    off: "강사 피드백이 올라오면 바로 알려드려요.",
    on: "이 기기로 피드백 알림을 받고 있어요.",
  };

  return (
    <section className="mx-4 mb-4 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-card">
      <span className="flex flex-col gap-0.5">
        <span className="text-base font-bold">피드백 알림</span>
        <span className="text-xs text-ink-sub">{note[state]}</span>
      </span>
      {(state === "off" || state === "on") && (
        <button
          type="button"
          disabled={busy}
          onClick={state === "on" ? turnOff : turnOn}
          className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold disabled:opacity-60 ${
            state === "on" ? "border border-line text-ink-sub" : "bg-brand text-white"
          }`}
        >
          {state === "on" ? "끄기" : "알림 켜기"}
        </button>
      )}
    </section>
  );
}
