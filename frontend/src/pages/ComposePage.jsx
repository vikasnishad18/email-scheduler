import EmailForm from "../components/email/EmailForm";

export default function ComposePage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Compose Email</h1>
      <EmailForm />
    </div>
  );
}
