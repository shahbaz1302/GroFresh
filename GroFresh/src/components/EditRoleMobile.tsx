"use client";

import axios from "axios";
import {
  ArrowRight,
  Bike,
  Check,
  Loader2,
  Phone,
  User2,
  UserCog,
} from "lucide-react";
import { motion } from "motion/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const roles = [
  {
    id: "user",
    label: "Shopper",
    description: "Find fresh favorites for your home.",
    icon: User2,
  },
  {
    id: "deliveryBoy",
    label: "Delivery partner",
    description: "Bring local groceries to nearby homes.",
    icon: Bike,
  },
  {
    id: "admin",
    label: "Administrator",
    description: "Manage the GroFresh marketplace.",
    icon: UserCog,
  },
];

const EditRoleMobile = () => {
  const [selectedRole, setSelectedRole] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [visibleRoles, setVisibleRoles] = useState(() =>
    roles.filter((role) => role.id !== "admin"),
  );
  const router = useRouter();
  const { update } = useSession();

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await axios.put("/api/user/edit-role-mobile", {
        role: selectedRole,
        mobile,
      });
      await update({ role: selectedRole });
      router.push("/");
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError<{ message?: string }>(error)) {
        toast.error(error.response?.data.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkForAdmin = async () => {
      try {
        const { data } = await axios.get<{ adminExist: boolean }>(
          "/api/check-for-admin",
        );
        if (typeof data.adminExist !== "boolean") {
          throw new Error("Invalid admin check response");
        }
        setVisibleRoles(
          data.adminExist
            ? roles.filter((role) => role.id !== "admin")
            : roles,
        );
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data.message || "Something went wrong");
        } else {
          console.error("Failed to check for an existing admin:", error);
          toast.error("Unable to check admin availability");
        }
      }
    };
    void checkForAdmin();
  }, []);

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
        className="relative w-full max-w-lg overflow-hidden rounded-4xl border border-white/80 bg-white/80 p-6 shadow-[0_30px_90px_-35px_rgba(24,59,43,0.4)] backdrop-blur-xl sm:p-9">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#9ccf73,#d7eb8f,#7ea961)]" />

        {/* <div className="flex items-center justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-[linear-gradient(135deg,#eaf5dc,#dfeec8)] text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_22px_-10px_rgba(121,167,95,0.8)]" aria-hidden="true">
            🌱
          </div>
          <div className="rounded-full border border-[#dfe8d8] bg-[#f4f8f1] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#54715a]">
            One last step
          </div>
        </div> */}

        <div className="mt-3 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#86a373]">
            Welcome to GroFresh
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.07em] text-[#173d2e] sm:text-4xl">
            Let’s get you set up.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#68776a]">
            Choose how you’ll use GroFresh and add a mobile number to finish
            setting up your profile.
          </p>
        </div>

        <div className="mt-7">
          <h2 className="text-sm font-bold text-[#284936]">I’m here as a...</h2>
          <div
            role="group"
            aria-label="Choose your account type"
            className="mt-3 grid gap-3">
            {visibleRoles.map((role) => {
              const Icon = role.icon;
              const isSelected = role.id === selectedRole;

              return (
                <motion.button
                  key={role.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#76a85b] ${
                    isSelected
                      ? "border-[#91b978] bg-[#f1f7eb] shadow-[0_10px_28px_-20px_rgba(24,59,43,0.55)]"
                      : "border-[#e8eee3] bg-[#fbfcfa] hover:border-[#cbdcc0] hover:bg-[#f8fbf5]"
                  }`}>
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      isSelected
                        ? "bg-[#dfeec8] text-[#426e3f]"
                        : "bg-[#f1f5ed] text-[#7b9270]"
                    }`}>
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-[#284936]">
                      {role.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-[#7b877f]">
                      {role.description}
                    </span>
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      isSelected
                        ? "border-[#568047] bg-[#568047] text-white"
                        : "border-[#d5dfcf] bg-white"
                    }`}>
                    {isSelected && (
                      <Check aria-hidden="true" className="h-3 w-3" />
                    )}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <label
            htmlFor="mobile"
            className="mb-2 block text-sm font-bold text-[#284936]">
            Mobile number
          </label>
          <div className="group flex items-center gap-3 rounded-2xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 transition focus-within:border-[#a9c68f] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dcebd0]/60">
            <Phone
              aria-hidden="true"
              className="h-4.5 w-4.5 shrink-0 text-[#8ca283] transition group-focus-within:text-[#547d46]"
            />
            <input
              type="tel"
              id="mobile"
              name="mobile"
              autoComplete="tel"
              inputMode="tel"
              placeholder="e.g. 98765 43210"
              value={mobile}
              onChange={(event) => setMobile(event.currentTarget.value)}
              className="min-w-0 w-full bg-transparent py-3.5 text-sm text-[#183b2b] outline-none placeholder:text-[#a0aaa0]"
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-[#879287]">
            We’ll use this number for delivery updates and account support.
          </p>
        </div>

        <motion.button
          type="button"
          disabled={mobile.length !== 10 || !selectedRole || loading}
          onClick={handleSubmit}
          className="mt-7 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#183b2b,#24583d)] px-6 py-4 text-sm font-bold text-white shadow-[0_18px_35px_-18px_rgba(24,59,43,0.9)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_38px_-18px_rgba(24,59,43,0.95)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#76a85b]">
          Continue to GroFresh
          {loading ? (
            <Loader2 />
          ) : (
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          )}
        </motion.button>

        <p className="mt-5 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#7d8b7f]">
          Fresh groceries, right around the corner.
        </p>
      </motion.section>
    </main>
  );
};

export default EditRoleMobile;
