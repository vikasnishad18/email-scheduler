import { useState } from "react";
import { sendEmail, scheduleEmail } from "../../services/emailApi";

export default function EmailForm() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState("now");
  const [sendAt, setSendAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!to || !subject || !body) {
      return setMessage("All fields are required");
    }

    if (mode === "schedule") {
      if (!sendAt) return setMessage("Please select date & time");

      const sendTime = new Date(sendAt).getTime();
      if (sendTime <= Date.now()) {
        return setMessage("Scheduled time must be in the future");
      }
    }

    setLoading(true);

    try {
      if (mode === "now") {
        await sendEmail({ to, subject, body });
        setMessage("Email queued successfully. Check dashboard.");
      } else {
        const sendAtUTC = new Date(sendAt).toISOString();
        await scheduleEmail({ to, subject, body, sendAt: sendAtUTC });
        setMessage("Email scheduled successfully. Check dashboard.");
      }

      setTo("");
      setSubject("");
      setBody("");
      setSendAt("");
    } catch (err) {
      setMessage(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-gray-900 p-6 rounded-lg"
    >
      <input
        disabled={loading}
        className="w-full p-2 rounded bg-gray-800 disabled:opacity-50"
        placeholder="To"
        value={to}
        onChange={e => setTo(e.target.value)}
      />

      <input
        disabled={loading}
        className="w-full p-2 rounded bg-gray-800 disabled:opacity-50"
        placeholder="Subject"
        value={subject}
        onChange={e => setSubject(e.target.value)}
      />

      <textarea
        disabled={loading}
        className="w-full p-2 rounded bg-gray-800 disabled:opacity-50"
        placeholder="Body"
        rows={5}
        value={body}
        onChange={e => setBody(e.target.value)}
      />

      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={mode === "now"}
            onChange={() => setMode("now")}
          />
          Send now
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={mode === "schedule"}
            onChange={() => setMode("schedule")}
          />
          Schedule
        </label>
      </div>

      {mode === "schedule" && (
        <input
          disabled={loading}
          type="datetime-local"
          className="w-full p-2 rounded bg-gray-800 disabled:opacity-50"
          value={sendAt}
          onChange={e => setSendAt(e.target.value)}
        />
      )}

      <button
        disabled={loading}
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading
          ? "Processing..."
          : mode === "now"
          ? "Send Email"
          : "Schedule Email"}
      </button>

      {message && (
        <p className="text-sm text-gray-300">{message}</p>
      )}
    </form>
  );
}
