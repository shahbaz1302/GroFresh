"use client";

import { removeCartData, updateQuantity } from "@/redux/cartSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

type CartProps = { isOpen: boolean; onClose: () => void };

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const Cart = ({ isOpen, onClose }: CartProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { cartData, subTotal, deliveryFee, totalAmount } = useSelector(
    (state: RootState) => state.cart,
  );
  const userData = useSelector((state: RootState) => state.user.userData);
  const itemCount = cartData.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.button
          type="button"
          key="cart-backdrop"
          aria-label="Close cart"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-60 cursor-default bg-[#183b2b]/35 backdrop-blur-[2px]"
        />
      )}
      {isOpen && (
        <motion.aside
          key="cart-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-title"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-y-0 right-0 z-70 flex w-full max-w-md flex-col bg-white font-sans text-[#183b2b] shadow-[-12px_0_45px_-18px_rgba(24,59,43,0.3)]">
          <header className="border-b border-[#e8eee3] px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#82967b]">
                  {userData?.name ? `Hi, ${userData.name}` : "Your basket"}
                </p>
                <h2
                  id="cart-title"
                  className="mt-1 text-xl font-extrabold tracking-tight">
                  Your cart
                </h2>
                <p aria-live="polite" className="mt-1 text-sm text-[#718575]">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close cart"
                onClick={onClose}
                className="flex cursor-pointer h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e8eee3] text-[#64776a] transition hover:bg-[#f5f9f1] hover:text-[#183b2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a9c68f]">
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
          </header>

          {cartData.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f7eb] text-[#6f9959]">
                <ShoppingBag aria-hidden="true" className="h-7 w-7" />
              </span>
              <h3 className="mt-5 text-lg font-bold">Your cart is empty</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-[#718575]">
                Add your everyday favourites and they’ll be waiting here.
              </p>
              <Link
                href="/shop"
                onClick={onClose}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#547d46] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#3f6535] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dcebd0]/70">
                Browse groceries
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-5 py-3 sm:px-6">
                <ul className="divide-y divide-[#edf1e9]">
                  {cartData.map((item) => (
                    <li key={item._id} className="flex gap-3 py-4 sm:gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f6f9f3]">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-contain p-2"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-[#284936]">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-xs text-[#82967b]">
                              {currency.format(item.price)} / {item.unit}
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${item.name} from cart`}
                            onClick={() => dispatch(removeCartData(item._id))}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#9b7168] transition hover:bg-[#fff4f1] hover:text-[#a34f3e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d98c7c]">
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div
                            aria-label={`${item.name}, quantity ${item.quantity}`}
                            className="inline-flex items-center rounded-lg border border-[#dce8d4] bg-[#f8fbf5]">
                            <button
                              type="button"
                              aria-label={`Remove one ${item.name}`}
                              onClick={() =>
                                dispatch(
                                  updateQuantity({
                                    groceryId: item._id,
                                    change: -1,
                                  }),
                                )
                              }
                              className="flex cursor-pointer h-8 w-9 items-center justify-center rounded-l-lg text-[#547d46] transition hover:bg-[#eaf3e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#76a85b]">
                              <Minus
                                aria-hidden="true"
                                className="h-3.5 w-3.5"
                              />
                            </button>
                            <span
                              aria-live="polite"
                              className="min-w-8 text-center text-sm font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Add one ${item.name}`}
                              onClick={() =>
                                dispatch(
                                  updateQuantity({
                                    groceryId: item._id,
                                    change: 1,
                                  }),
                                )
                              }
                              className="flex cursor-pointer h-8 w-9 items-center justify-center rounded-r-lg text-[#547d46] transition hover:bg-[#eaf3e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#76a85b]">
                              <Plus
                                aria-hidden="true"
                                className="h-3.5 w-3.5"
                              />
                            </button>
                          </div>
                          <p className="text-sm font-extrabold text-[#3f6535]">
                            {currency.format(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <footer className="border-t border-[#e8eee3] bg-white px-5 pb-5 pt-4 sm:px-6">
                <h3 className="text-base font-extrabold text-[#183b2b]">
                  Bill details
                </h3>
                <div className="mt-3 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#64776a]">Items total</span>
                    <span className="font-semibold text-[#284936]">
                      {currency.format(subTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#64776a]">Delivery fee</span>
                    <span
                      className={`font-semibold ${
                        deliveryFee === 0 ? "text-[#4d813e]" : "text-[#284936]"
                      }`}>
                      {deliveryFee === 0
                        ? "FREE"
                        : currency.format(deliveryFee)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-dashed border-[#dce8d4] pt-3">
                  <span className="font-bold text-[#284936]">Grand total</span>
                  <span className="text-lg font-extrabold text-[#183b2b]">
                    {currency.format(totalAmount)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#82967b]">
                  Inclusive of all applicable charges.
                </p>
                <Link
                  href={userData ? "/checkout" : "/login"}
                  onClick={onClose}
                  className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#547d46] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#3f6535] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dcebd0]/70">
                  Proceed to checkout
                </Link>
              </footer>
            </>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Cart;
