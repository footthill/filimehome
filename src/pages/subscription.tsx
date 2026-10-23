import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FaCheckCircle,
  FaCopy,
  FaPhoneAlt,
  FaWhatsapp,
  FaCalendarCheck,
  FaShieldAlt,
  FaPager,
} from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa6";
import { Link } from "react-router-dom";
import {
  PLANS,
  getUserId,
  fetchSubscriptionStatus,
  requestSubscription,
  applyAdFreeState,
  ussdCode,
  dialLink,
  waLink,
  formatDate,
  MOBILE_MONEY_NAME,
  hasSubscriptionWorker,
  type PlanKey,
  type SubscriptionStatus,
} from "../lib/subscription";

const Subscription = () => {
  const userId = useMemo(() => getUserId(), []);
  const [status, setStatus] = useState<SubscriptionStatus | null | undefined>(undefined);
  const [selected, setSelected] = useState<PlanKey | null>(null);
  const [requesting, setRequesting] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus(userId).then(setStatus).catch(() => setStatus(null));
  }, [userId]);

  const active = Boolean(status?.active);
  const pending = status?.status === "pending";

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      toast.success("User ID copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const pickPlan = async (plan: PlanKey) => {
    setSelected(plan);
    if (!hasSubscriptionWorker) return;
    setRequesting(true);
    const ok = await requestSubscription(plan, userId);
    setRequesting(false);
    if (ok) {
      const fresh = await fetchSubscriptionStatus(userId);
      if (fresh) setStatus(fresh);
      toast.success("Plan selected — pay via MoMo then confirm on WhatsApp");
    }
  };

  const refreshStatus = async () => {
    toast.loading("Checking subscription...", { id: "checking" });
    const fresh = await fetchSubscriptionStatus(userId);
    if (fresh) setStatus(fresh);
    await applyAdFreeState();
    toast.dismiss("checking");
    if (fresh?.active) toast.success("You are ad-free — ads disabled on this device");
    else toast("Subscription not confirmed yet", { icon: "⏳" });
  };

  const selectId =
    selected ?? (status?.plan && PLANS[status.plan] ? (status.plan as PlanKey) : "weekly");

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 mb-50 text-white">
      <Toaster position="top-center" />

      <div className="flex items-center gap-3 mb-4">
        <Link to="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10">
          <FaArrowLeft />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <FaShieldAlt className="text-green-400" /> Remove Ads
        </h1>
      </div>

      {/* Status banner */}
      <div
        className={`rounded-xl p-4 mb-6 border ${
          active
            ? "bg-green-900/30 border-green-500/40"
            : pending
              ? "bg-yellow-900/20 border-yellow-500/40"
              : "bg-white/5 border-gray-700"
        }`}
      >
        {status === undefined ? (
          <p className="text-gray-400">Checking your subscription…</p>
        ) : (
          <div className="flex items-start gap-3">
            {active ? (
              <FaCheckCircle className="text-green-400 text-2xl mt-0.5" />
            ) : pending ? (
              <FaPager className="text-yellow-400 text-2xl mt-0.5" />
            ) : (
              <FaCalendarCheck className="text-gray-400 text-2xl mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {active
                  ? "You are ad-free 🎉"
                  : pending
                    ? "Payment confirmation pending"
                    : "You are seeing ads"}
              </p>
              <p className="text-sm text-gray-300 mt-1">
                {active && status?.expiresAt
                  ? `Active until ${formatDate(status.expiresAt)}`
                  : pending
                    ? `We received a ${status?.plan === "monthly" ? "Monthly (2000 RWF)" : "Weekly (1000 RWF)"} request. After you pay, send the WhatsApp message below — the admin will confirm shortly.`
                    : "Subscribe below to watch without any ads."}
              </p>
              <button
                onClick={refreshStatus}
                className="mt-2 text-xs underline text-green-400 hover:text-green-300"
              >
                Refresh status
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Your user id */}
      <div className="rounded-xl border border-gray-700 bg-white/5 p-4 mb-6">
        <p className="text-sm text-gray-300 mb-2">
          Your <span className="font-semibold text-white">User ID</span> — include it in your
          WhatsApp message so the admin can confirm you. Keep it in this browser.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-black/60 rounded-lg px-3 py-2 text-sm break-all select-all">
            {userId}
          </code>
          <button
            onClick={copyId}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
            aria-label="Copy user id"
          >
            {copied ? <FaCheckCircle className="text-green-400" /> : <FaCopy />}
            <span className="text-sm hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Plan cards */}
        <div>
          <h2 className="text-lg font-semibold mb-3">1. Choose a plan</h2>
          <div className="space-y-3">
            {(Object.keys(PLANS) as PlanKey[]).map((key) => {
              const plan = PLANS[key];
              return (
                <button
                  key={key}
                  onClick={() => pickPlan(key)}
                  className={`w-full text-left rounded-xl border p-4 transition ${
                    selected === key
                      ? "border-green-500 bg-green-900/20"
                      : "border-gray-700 bg-white/5 hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {plan.label} — {plan.amount} RWF
                      </p>
                      <p className="text-sm text-gray-400">{plan.days} days ad-free</p>
                    </div>
                    <span
                      className={`text-lg ${selected === key ? "text-green-400" : "text-gray-500"}`}
                    >
                      {selected === key ? "✓" : "+"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* MoMo */}
        <div>
          <h2 className="text-lg font-semibold mb-3">2. Pay with MTN MoMo</h2>
          <div className="rounded-xl border border-gray-700 bg-white/5 p-4">
            <p className="text-sm text-gray-300 mb-3">
              Dial this code, send the total to{" "}
              <span className="text-white font-semibold">{MOBILE_MONEY_NAME}</span>, and confirm
              with your MoMo PIN:
            </p>
            <code className="block bg-black/60 rounded-lg px-3 py-3 text-center text-green-300 font-mono text-lg tracking-wide mb-3">
              {ussdCode(selectId)}
            </code>
            <a
              href={dialLink(selectId)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold transition"
            >
              <FaPhoneAlt /> Open dialer
            </a>
            <p className="text-xs text-gray-400 mt-2">
              *182*8*1*1603518*{PLANS[selectId].ussdAmount}# — amount shown matches your chosen
              plan.
            </p>
          </div>
        </div>
      </div>

      {/* WhatsApp confirm */}
      <div className="rounded-xl border border-gray-700 bg-white/5 p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-1">3. Tell us you paid</h2>
        <p className="text-sm text-gray-300 mb-4">
          After paying, send the WhatsApp message below to <b>079 556 578</b>. It already includes
          your plan, amount, and <b>User ID</b> — just press send so the admin can confirm you as
          paid.
        </p>
        <a
          href={waLink(selectId, userId)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            setRequesting(true);
            requestSubscription(selectId, userId).finally(() => setRequesting(false));
          }}
          className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-base transition"
        >
          <FaWhatsapp size={22} />
          {requesting ? "Sending…" : "Confirm payment on WhatsApp"}
        </a>
      </div>
    </div>
  );
};

export default Subscription;