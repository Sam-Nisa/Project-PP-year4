import { create } from "zustand";
import { request } from "../utils/request";
import { useAuthStore } from "./authStore";

export const useAddToCartStore = create((set, get) => ({
  cartItems: [],
  loading: false,
  error: null,

  // ---------------------- FETCH CART ----------------------
  fetchCart: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });

    try {
      const data = await request(
        "/api/cart",
        "GET",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      set({ cartItems: data.items || [] });
    } catch (err) {
      console.error(err);
      set({ error: err.response?.data?.error || "Failed to fetch cart" });
    } finally {
      set({ loading: false });
    }
  },

  // ---------------------- ADD TO CART ----------------------
  addToCart: async (bookId, quantity = 1) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("User not logged in");

    set({ loading: true, error: null });

    try {
      const data = await request(
        "/api/cart/add",
        "POST",
        { book_id: bookId, quantity },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      set((state) => {
        const existing = state.cartItems.find((i) => i.book_id === bookId);

        if (existing) {
          return {
            cartItems: state.cartItems.map((item) =>
              item.book_id === bookId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          };
        }

        return { cartItems: [...state.cartItems, data.item] };
      });

      return data.item;
    } catch (err) {
      console.error("Failed to add to cart:", err);
      set({ error: err.response?.data?.error || "Failed to add to cart" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  // ---------------------- UPDATE CART ----------------------
  updateCartItem: async (bookId, quantity) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });

    try {
      const data = await request(
        `/api/cart/item/${bookId}`,
        "PATCH",
        { quantity },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      set((state) => ({
        cartItems: state.cartItems.map((item) =>
          item.book_id === bookId ? data.item : item
        ),
      }));

      return data.item;
    } catch (err) {
      console.error("Failed to update cart:", err);
      set({ error: err.response?.data?.error || "Failed to update cart item" });
    } finally {
      set({ loading: false });
    }
  },

  // ---------------------- REMOVE ITEM ----------------------
  removeFromCart: async (cartItemId) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });

    try {
      // FIX 1: Use the cartItemId in the URL parameter
      await request(
        `/api/cart/item/${cartItemId}`,
        "DELETE",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // FIX 2: Remove item from UI instantly using cartItemId
      set((state) => ({
        cartItems: state.cartItems.filter((item) => item.id !== cartItemId),
      }));
    } catch (err) {
      console.error("Failed to remove item:", err);
      // NOTE: We now log the error clearly for the user via the `error` state.
      set({ error: err.response?.data?.error || "Failed to remove item" });
      // Throwing the error here is optional but good for components that need to react.
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  // ---------------------- CLEAR CART ----------------------
  clearCart: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });

    try {
      await request(
        `/api/cart/clear`,
        "DELETE",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      set({ cartItems: [] });
    } catch (err) {
      console.error("Failed to clear cart:", err);
      set({ error: err.response?.data?.error || "Failed to clear cart" });
    } finally {
      set({ loading: false });
    }
  },
}));
