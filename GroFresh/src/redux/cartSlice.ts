import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  _id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  unit: string;
  quantity: number;
}

interface ICartSlice {
  cartData: CartItem[];
  subTotal: number;
  deliveryFee: number;
  totalAmount: number;
}

const initialState: ICartSlice = {
  cartData: [],
  subTotal: 0,
  deliveryFee: 0,
  totalAmount: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartData: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.cartData.find(
        (item) => item._id === action.payload._id,
      );
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.cartData.push(action.payload);
      }
      cartSlice.caseReducers.calculateTotals(state);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ groceryId: string; change: number }>,
    ) => {
      const item = state.cartData.find(
        (cartItem) => cartItem._id === action.payload.groceryId,
      );

      if (!item) {
        return;
      }

      item.quantity = Math.max(0, item.quantity + action.payload.change);
      if (item.quantity === 0) {
        state.cartData = state.cartData.filter(
          (cartItem) => cartItem._id !== action.payload.groceryId,
        );
      }
      cartSlice.caseReducers.calculateTotals(state);
    },
    removeCartData: (state, action: PayloadAction<string>) => {
      state.cartData = state.cartData.filter(
        (item) => item._id !== action.payload,
      );
      cartSlice.caseReducers.calculateTotals(state);
    },
    clearCartData: (state) => {
      state.cartData = [];
      cartSlice.caseReducers.calculateTotals(state);
    },
    calculateTotals: (state) => {
      state.subTotal = state.cartData.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );
      state.deliveryFee = state.subTotal > 100 ? 0 : 40;
      state.totalAmount = state.subTotal + state.deliveryFee;
    },
  },
});

export const { setCartData, updateQuantity, removeCartData, clearCartData } =
  cartSlice.actions;
export default cartSlice.reducer;
