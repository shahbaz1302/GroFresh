"use client";

import axios from "axios";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User2,
} from "lucide-react";
import { motion } from "motion/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SubmitEvent, useState, type ChangeEvent } from "react";
import toast from "react-hot-toast";

type RegisterFormProps = { previousStep: (step: number) => void };

export default function RegisterForm({ previousStep }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;

    setFormData((previousData) => ({ ...previousData, [name]: value }));
  };

  const formIsValid =
    formData.name.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.password !== "";

  const handleRegister = async (event: SubmitEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await axios.post("/api/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      toast.success("Account created successfully!");
      setFormData({ name: "", email: "", password: "" });
      router.push("/login");
    } catch (error) {
      if (
        axios.isAxiosError<{ message?: string }>(error) &&
        error.response?.status === 400 &&
        error.response.data.message
      ) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Unable to create your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex max-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#f8fbf5_0%,#f2f7ee_38%,#eaf1e5_100%)] px-5 py-10 font-sans text-[#183b2b]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-[#dfeec8]/80 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-[#f6e7c7]/80 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.3),transparent_42%,rgba(121,167,95,0.08))]"
      />

      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-4xl border border-white/80 bg-white/80 p-6 shadow-[0_30px_90px_-35px_rgba(24,59,43,0.4)] backdrop-blur-xl sm:p-9">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#9ccf73,#d7eb8f,#7ea961)]" />

        <button
          type="button"
          onClick={() => previousStep(1)}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#607367] transition hover:bg-[#f1f6ec] hover:text-[#183b2b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#76a85b]">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back
        </button>

        <div className="mt-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#86a373]">
            Create your account
          </p>
          <motion.h1
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-2 text-3xl font-black tracking-[-0.07em] text-[#173d2e] sm:text-4xl">
            Join GroFresh
            <span className="bg-[linear-gradient(90deg,#5d8d4c,#9dcf5d)] bg-clip-text text-transparent">
              .
            </span>
          </motion.h1>
          <p className="mt-2 text-sm leading-6 text-[#68776a]">
            Your local favorites, delivered fresh to your door.
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="mt-7 space-y-4"
          onSubmit={handleRegister}>
          <div>
            <div className="group flex items-center gap-3 rounded-2xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 transition focus-within:border-[#a9c68f] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dcebd0]/60">
              <User2
                aria-hidden="true"
                className="h-4.5 w-4.5 shrink-0 text-[#8ca283] transition group-focus-within:text-[#547d46]"
              />
              <input
                id="register-name"
                aria-label="Your name"
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Alex Green"
                value={formData.name}
                onChange={handleChange}
                required
                className="min-w-0 w-full bg-transparent py-3.5 text-sm text-[#183b2b] outline-none placeholder:text-[#a0aaa0]"
              />
            </div>
          </div>

          <div>
            <div className="group flex items-center gap-3 rounded-2xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 transition focus-within:border-[#a9c68f] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dcebd0]/60">
              <Mail
                aria-hidden="true"
                className="h-4.5 w-4.5 shrink-0 text-[#8ca283] transition group-focus-within:text-[#547d46]"
              />
              <input
                id="register-email"
                aria-label="Email address"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="min-w-0 w-full bg-transparent py-3.5 text-sm text-[#183b2b] outline-none placeholder:text-[#a0aaa0]"
              />
            </div>
          </div>

          <div>
            <div className="group flex items-center gap-3 rounded-2xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 transition focus-within:border-[#a9c68f] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dcebd0]/60">
              <Lock
                aria-hidden="true"
                className="h-4.5 w-4.5 shrink-0 text-[#8ca283] transition group-focus-within:text-[#547d46]"
              />
              <input
                id="register-password"
                aria-label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
                className="min-w-0 w-full bg-transparent py-3.5 text-sm text-[#183b2b] outline-none placeholder:text-[#a0aaa0]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="shrink-0 rounded-lg p-1 text-[#8ca283] transition hover:text-[#315c3d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#76a85b]">
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="h-4.5 w-4.5" />
                ) : (
                  <Eye aria-hidden="true" className="h-4.5 w-4.5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!formIsValid || loading}
            className="mt-2 cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#183b2b,#24583d)] px-6 py-4 text-sm font-bold text-white shadow-[0_18px_35px_-18px_rgba(24,59,43,0.9)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_38px_-18px_rgba(24,59,43,0.95)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#76a85b] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0">
            {loading ? (
              <>
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create account
                <span aria-hidden="true" className="text-base">
                  →
                </span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3 py-1" aria-hidden="true">
            <span className="h-px flex-1 bg-[#e5ecdf]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#98a398]">
              or continue with
            </span>
            <span className="h-px flex-1 bg-[#e5ecdf]" />
          </div>
        </motion.form>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="inline-flex cursor-pointer w-full items-center justify-center gap-3 mt-4 rounded-full border border-[#dfe7d8] bg-white px-6 py-3.5 text-sm font-semibold text-[#33483a] shadow-[0_8px_24px_-18px_rgba(24,59,43,0.4)] transition duration-200 hover:-translate-y-0.5 hover:border-[#cbdac0] hover:bg-[#fbfdf9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#76a85b]">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.09-1.92 3.27-4.75 3.27-8.1Z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.15a11 11 0 0 0 0 9.9l3.69-2.84Z"
            />
            <path
              fill="#EA4335"
              d="M12 5.36c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.11 14.97 1 12 1a11 11 0 0 0-9.85 6.05l3.69 2.84C6.71 7.29 9.14 5.36 12 5.36Z"
            />
          </svg>
          Sign in with Google
        </button>

        <p className="mt-6 text-center text-xs font-medium leading-5 text-[#879287]">
          Already have an account?{"  "}
          <span
            onClick={() => router.push("/login")}
            className="cursor-pointer font-bold text-[#426e3f] underline decoration-[#b7d39d] decoration-2 underline-offset-4">
            Sign in
          </span>
        </p>
      </motion.section>
    </main>
  );
}
