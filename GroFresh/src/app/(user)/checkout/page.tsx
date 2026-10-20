"use client";

import { clearCartData } from "@/redux/cartSlice";
import { RootState } from "@/redux/store";
import axios from "axios";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Loader2,
  LockKeyhole,
  MapPin,
  Navigation,
  PackageCheck,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

type PaymentMethod = "online" | "cash";

const CheckoutMap = dynamic(() => import("@/components/CheckoutMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[#718575]">
      Loading map...
    </div>
  ),
});

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const paymentMethods: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: typeof CreditCard;
}[] = [
  {
    id: "online",
    label: "Online",
    description: "Pay via Stripe",
    icon: Smartphone,
  },
  {
    id: "cash",
    label: "Cash on delivery",
    description: "Pay when your groceries arrive",
    icon: WalletCards,
  },
];

const fieldClassName =
  "mt-2 w-full rounded-xl border border-[#e5eae0] bg-white px-3.5 py-3 text-sm text-[#263a2d] outline-none transition placeholder:text-[#a1aca0] hover:border-[#c7d6bd] focus:border-[#6e9b58] focus:ring-4 focus:ring-[#eaf3e3]";

const CheckoutPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { cartData, subTotal, deliveryFee, totalAmount } = useSelector(
    (state: RootState) => state.cart,
  );
  const userData = useSelector((state: RootState) => state.user.userData);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [search, setSeaarch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.log(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    }
  }, []);

  useEffect(() => {
    if (userData) {
      setAddress((prevAddress) => ({
        ...prevAddress,
        fullName: userData.name || "",
        phone: userData.mobile || "",
      }));
    }
  }, [userData]);

  useEffect(() => {
    const fetchAddress = async () => {
      if (!position) return;
      try {
        const result = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?lat=${position[0]}&lon=${position[1]}&format=json`,
        );
        setAddress((prev) => ({
          ...prev,
          city: result.data.address.city,
          state: result.data.address.state,
          pincode: result.data.address.postcode,
          street: result.data.display_name,
        }));
      } catch (error) {
        console.log(error);
      }
    };
    fetchAddress();
  }, [position]);

  const handleSearch = async () => {
    setSearchLoading(true);
    const { OpenStreetMapProvider } = await import("leaflet-geosearch");
    const provider = new OpenStreetMapProvider();
    const results = await provider.search({ query: search });
    console.log(results);
    if (results.length > 0) {
      setSearchLoading(false);
      setPosition([results[0].y, results[0].x]);
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.log(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    }
  };

  const handleCashOrder = async () => {
    try {
      const result = await axios.post("/api/user/order", {
        userId: userData?._id,
        items: cartData.map((item) => ({
          groceryId: item._id,
          name: item.name,
          image: item.image,
          price: item.price,
          unit: item.unit,
          quantity: item.quantity,
        })),
        totalAmount,
        paymentMethod: "cash",
        deliveryAddress: {
          fullName: address.fullName,
          phone: address.phone,
          street: address.street,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          latitude: position?.[0],
          longitude: position?.[1],
        },
      });
      const orderId = result.data?.order?._id;
      dispatch(clearCartData());
      router.push(
        orderId ? `/order-success?orderId=${orderId}` : "/order-success",
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleOnlinePayment = async () => {
    try {
      const result = await axios.post("/api/user/payment", {
        userId: userData?._id,
        items: cartData.map((item) => ({
          groceryId: item._id,
          name: item.name,
          image: item.image,
          price: item.price,
          unit: item.unit,
          quantity: item.quantity,
        })),
        totalAmount,
        paymentMethod: "online",
        deliveryAddress: {
          fullName: address.fullName,
          phone: address.phone,
          street: address.street,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          latitude: position?.[0],
          longitude: position?.[1],
        },
      });
      const url = result.data?.url;
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const itemCount = cartData.reduce((total, item) => total + item.quantity, 0);

  return (
    <main className="min-h-screen bg-[#f7f8f4] px-4 pb-12 pt-5 text-[#263a2d] sm:px-6 sm:pt-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold text-[#66776a] transition hover:text-[#294b35] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dcebd0]">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Back to shopping</span>
            <span className="sm:hidden">Back</span>
          </button>

          <Link
            href="/"
            aria-label="GroFresh home"
            className="text-xl font-black tracking-[-0.06em] text-[#294b35] sm:text-2xl">
            GRO<span className="text-[#80a85d]">FRESH</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#778579] sm:text-sm">
            <LockKeyhole
              aria-hidden="true"
              className="h-4 w-4 text-[#80a85d]"
            />
            <span className="hidden sm:inline">Secure checkout</span>
            <span className="sm:hidden">Secure</span>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#86a177]">
              Almost there
            </p>
            <h1 className="text-3xl font-black tracking-[-0.045em] text-[#263a2d] sm:text-4xl">
              Checkout
            </h1>
            <p className="mt-2 text-sm text-[#7a887c]">
              Fresh picks, on their way to your door.
            </p>
          </div>
          <ol
            aria-label="Checkout progress"
            className="flex items-center gap-2">
            <li className="flex items-center gap-2 text-xs font-bold text-[#5e8b4d] sm:text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f1e1]">
                <Check aria-hidden="true" className="h-4 w-4" />
              </span>
              Basket
            </li>
            <ChevronRight
              aria-hidden="true"
              className="h-4 w-4 text-[#c3ccc0]"
            />
            <li
              aria-current="step"
              className="flex items-center gap-2 text-xs font-bold text-[#294b35] sm:text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#294b35] text-xs text-white">
                2
              </span>
              Checkout
            </li>
            <ChevronRight
              aria-hidden="true"
              className="h-4 w-4 text-[#c3ccc0]"
            />
            <li className="flex items-center gap-2 text-xs font-semibold text-[#a0aaa0] sm:text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#dfe5dc] bg-white text-xs">
                3
              </span>
              Done
            </li>
          </ol>
        </motion.div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] lg:gap-8">
          <motion.section
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            aria-label="Delivery details"
            className="space-y-5">
            <section className="rounded-3xl border border-[#e8ece4] bg-white p-5 shadow-[0_12px_35px_-28px_rgba(39,67,47,0.35)] sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf4e8] text-[#638a50]">
                    <MapPin aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a978b]">
                      Step 1
                    </p>
                    <h2 className="mt-1 text-lg font-extrabold tracking-tight">
                      Delivery details
                    </h2>
                  </div>
                </div>
                <span className="rounded-full bg-[#f2f6ee] px-3 py-1.5 text-[11px] font-bold text-[#64864f]">
                  Saved for this order
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-[#5d6e61]">
                  Full name
                  <input
                    autoComplete="name"
                    value={address.fullName}
                    onChange={(e) =>
                      setAddress((prevAddress) => ({
                        ...prevAddress,
                        fullName: e.target.value,
                      }))
                    }
                    placeholder="e.g. Alex Morgan"
                    className={fieldClassName}
                  />
                </label>
                <label className="text-xs font-bold text-[#5d6e61]">
                  Phone number
                  <input
                    autoComplete="tel"
                    value={address.phone}
                    onChange={(e) =>
                      setAddress((prevAddress) => ({
                        ...prevAddress,
                        phone: e.target.value,
                      }))
                    }
                    inputMode="tel"
                    placeholder="+91 98765 43210"
                    className={fieldClassName}
                  />
                </label>
                <label className="text-xs font-bold text-[#5d6e61] sm:col-span-2">
                  Street address
                  <input
                    autoComplete="street-address"
                    value={address.street}
                    onChange={(e) =>
                      setAddress((prevAddress) => ({
                        ...prevAddress,
                        street: e.target.value,
                      }))
                    }
                    placeholder="House / flat number, street name"
                    className={fieldClassName}
                  />
                </label>
                <label className="text-xs font-bold text-[#5d6e61]">
                  City
                  <input
                    autoComplete="address-level2"
                    value={address.city}
                    onChange={(e) =>
                      setAddress((prevAddress) => ({
                        ...prevAddress,
                        city: e.target.value,
                      }))
                    }
                    placeholder="City"
                    className={fieldClassName}
                  />
                </label>
                <label className="text-xs font-bold text-[#5d6e61]">
                  PIN code
                  <input
                    autoComplete="postal-code"
                    inputMode="numeric"
                    value={address.pincode}
                    onChange={(e) =>
                      setAddress((prevAddress) => ({
                        ...prevAddress,
                        pincode: e.target.value,
                      }))
                    }
                    placeholder="6-digit PIN"
                    className={fieldClassName}
                  />
                </label>
              </div>

              <label className="mt-4 block text-xs font-bold text-[#5d6e61]">
                Delivery instructions
                <textarea
                  rows={2}
                  placeholder="Landmark, gate code or anything else we should know"
                  className={`${fieldClassName} resize-y`}
                />
              </label>

              <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSeaarch(e.target.value)}
                    placeholder="Search area or street"
                    aria-label="Search area or street"
                    className="min-w-0 flex-1 rounded-l-xl border border-r-0 border-[#e5eae0] bg-white px-3.5 py-2.5 text-sm text-[#263a2d] outline-none transition placeholder:text-[#a1aca0] hover:border-[#c7d6bd] focus:border-[#6e9b58] focus:ring-4 focus:ring-inset focus:ring-[#eaf3e3]"
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searchLoading}
                    className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-r-xl border border-[#4f7d43] bg-[#4f7d43] px-4 py-2.5 text-xs font-bold text-white transition hover:border-[#3f6b37] hover:bg-[#3f6b37] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dcebd0]">
                    {searchLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCurrentLocation}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e4ebe0] bg-white px-3 py-2 text-xs font-bold text-[#60844d] transition hover:border-[#c1d5b3] hover:bg-[#f7faf4] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#eaf3e3]">
                  <Navigation aria-hidden="true" className="h-3.5 w-3.5" />
                  Use my location
                </button>
              </div>

              <div className="mt-4 h-64 w-full overflow-hidden rounded-2xl border border-[#e3e9de] bg-[#eaf0e5] sm:h-72">
                {position && (
                  <CheckoutMap position={position} setPosition={setPosition} />
                )}
              </div>
            </section>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            aria-label="Payment and order summary"
            className="space-y-5 lg:sticky lg:top-6">
            <section className="rounded-3xl border border-[#e8ece4] bg-white p-5 shadow-[0_12px_35px_-28px_rgba(39,67,47,0.35)] sm:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf4e8] text-[#638a50]">
                    <WalletCards aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a978b]">
                      Step 2
                    </p>
                    <h2 className="mt-1 text-lg font-extrabold tracking-tight">
                      Payment method
                    </h2>
                  </div>
                </div>
                <ShieldCheck
                  aria-hidden="true"
                  className="mt-1 h-5 w-5 text-[#7da765]"
                />
              </div>

              <div className="space-y-2.5">
                {paymentMethods.map(
                  ({ id, label, description, icon: Icon }) => {
                    const selected = paymentMethod === id;

                    return (
                      <motion.button
                        key={id}
                        type="button"
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setPaymentMethod(id)}
                        aria-pressed={selected}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#eaf3e3] ${
                          selected
                            ? "border-[#83a970] bg-[#f7faf4] shadow-[0_4px_14px_-12px_rgba(72,115,63,0.55)]"
                            : "border-[#edf0ea] hover:border-[#d3dfcb]"
                        }`}>
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            selected
                              ? "bg-[#e7f0df] text-[#5d8749]"
                              : "bg-[#f5f6f2] text-[#879287]"
                          }`}>
                          <Icon aria-hidden="true" className="h-4.5 w-4.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold">
                            {label}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-[#89958a]">
                            {description}
                          </span>
                        </span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-[#5f8c4b] bg-[#5f8c4b] text-white"
                              : "border-[#d9e0d6] bg-white"
                          }`}>
                          {selected && (
                            <Check aria-hidden="true" className="h-3 w-3" />
                          )}
                        </span>
                      </motion.button>
                    );
                  },
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-[#e8ece4] bg-white p-5 shadow-[0_12px_35px_-28px_rgba(39,67,47,0.35)] sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">
                    Order summary
                  </h2>
                  <p className="mt-1 text-xs text-[#889489]">
                    {itemCount} {itemCount === 1 ? "item" : "items"} in your
                    basket
                  </p>
                </div>
                <PackageCheck
                  aria-hidden="true"
                  className="h-5 w-5 text-[#7da765]"
                />
              </div>

              {cartData.length > 0 ? (
                <ul className="mt-5 max-h-48 space-y-3 overflow-y-auto pr-1">
                  {cartData.map((item) => (
                    <li
                      key={item._id}
                      className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-[#6e7c70]">
                        <span className="font-bold text-[#3f5545]">
                          {item.quantity}×
                        </span>{" "}
                        {item.name}
                      </span>
                      <span className="shrink-0 font-semibold text-[#46584a]">
                        {currency.format(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 rounded-2xl bg-[#f8f9f6] px-4 py-4 text-center">
                  <p className="text-sm font-bold text-[#536556]">
                    Your basket is empty
                  </p>
                  <Link
                    href="/shop"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#638a50] hover:text-[#436b36]">
                    Browse groceries{" "}
                    <ArrowRight aria-hidden="true" className="h-3 w-3" />
                  </Link>
                </div>
              )}

              <div className="my-5 border-t border-dashed border-[#e1e7dd]" />
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-[#778579]">
                  <dt>Subtotal</dt>
                  <dd className="font-semibold text-[#46584a]">
                    {currency.format(subTotal)}
                  </dd>
                </div>
                <div className="flex items-center justify-between text-[#778579]">
                  <dt>Delivery fee</dt>
                  <dd className="font-semibold text-[#46584a]">
                    {deliveryFee === 0 && subTotal > 0 ? (
                      <span className="font-bold text-[#64864f]">FREE</span>
                    ) : (
                      currency.format(deliveryFee)
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between text-[#778579]">
                  <dt>Taxes</dt>
                  <dd className="font-semibold text-[#46584a]">Included</dd>
                </div>
              </dl>

              <div className="mt-5 flex items-end justify-between border-t border-[#edf0ea] pt-5">
                <div>
                  <p className="text-sm font-extrabold">Total</p>
                  <p className="mt-1 text-[11px] text-[#89958a]">
                    Inclusive of all taxes
                  </p>
                </div>
                <p className="text-2xl font-black tracking-tight text-[#294b35]">
                  {currency.format(totalAmount)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (paymentMethod === "cash") {
                    handleCashOrder();
                  } else {
                    handleOnlinePayment();
                  }
                }}
                disabled={cartData.length === 0}
                className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#4f7d43] px-5 py-4 text-sm font-extrabold text-white shadow-[0_10px_20px_-12px_rgba(53,99,53,0.8)] transition hover:bg-[#3f6b37] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dcebd0] disabled:cursor-not-allowed disabled:bg-[#aab8a4] disabled:shadow-none">
                Place order · {currency.format(totalAmount)}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-medium text-[#94a094]">
                <LockKeyhole aria-hidden="true" className="h-3 w-3" />
                Your payment details are encrypted and secure
              </p>
            </section>

            <p className="px-2 text-center text-[11px] leading-5 text-[#9aa49a]">
              By placing your order, you agree to our{" "}
              <span className="font-semibold text-[#71866d]">Terms</span> and{" "}
              <span className="font-semibold text-[#71866d]">
                Privacy Policy
              </span>
              .
            </p>
          </motion.aside>
        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;
