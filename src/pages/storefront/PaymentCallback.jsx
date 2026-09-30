import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyPayment, payNow } from "../../services/paymentService";

// Paystack sends the customer back here after they pay (or cancel).
export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reference = params.get("reference") || params.get("trxref");
  const [failed, setFailed] = useState(null); // { message, orderId }
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!reference) { setFailed({ message: "No payment reference found." }); return; }
    verifyPayment(reference)
      .then((r) => {
        if (r.paid) {
          navigate(`/order-confirmation/${r.orderId}`, {
            replace: true,
            state: { orderNumber: r.orderNumber, total: r.total, paymentMethod: "online", paymentStatus: "paid" },
          });
        } else {
          setFailed({ orderId: r.orderId, message: "We couldn't confirm your payment. You haven't been charged unless your bank says otherwise." });
        }
      })
      .catch((err) => setFailed({ message: err.message }));
  }, [reference, navigate]);

  async function retry() {
    setRetrying(true);
    try { await payNow(failed.orderId); }
    catch (err) { setFailed({ ...failed, message: err.message }); setRetrying(false); }
  }

  if (!failed) {
    return (
      <div className="section empty">
        <div className="spinner" />
        <h2>Confirming your payment…</h2>
        <p className="muted">Please don't close this page.</p>
      </div>
    );
  }

  return (
    <div className="section empty">
      <h2>Payment not completed</h2>
      <p className="muted">{failed.message}</p>
      {failed.orderId && <button className="btn" onClick={retry} disabled={retrying}>{retrying ? "Redirecting…" : "Try payment again"}</button>}
      <p style={{ marginTop: 16 }}><a href="/shop">Back to shop</a></p>
    </div>
  );
}
