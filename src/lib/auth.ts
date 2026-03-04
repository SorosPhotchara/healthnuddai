import { create } from "zustand";

interface User {
  title: string;
  identification_number: string;
  email: string;
  password?: string; // Optional because we don't always need to pass it back
  fname: string;
  lname: string;
  sex: string;
  phone_number: string;
  role: string;
  birth_date: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  set_user: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  load_user: () => Promise<void>; // Changed to Promise for async fetching
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  set_user: (user) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
    set({ user });
  },

  login: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem("user");
    set({ user: null });
  },

  load_user: async () => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      set({ user: null, isLoading: false });
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      const res = await fetch(`/api/users/check?id=${parsedUser.identification_number}`);
      const data = await res.json();

      if (data.success && data.user) {
        // Merge stored data with fresh DB data
        const updatedUser = { ...parsedUser, ...data.user };

        // Update both LocalStorage and State
        localStorage.setItem("user", JSON.stringify(updatedUser));
        set({ user: updatedUser, isLoading: false });
      } else {
        // If API fails, fallback to stored data
        set({ user: parsedUser, isLoading: false });
      }
    } catch (error) {
      console.error("Auth Load Error:", error);
      // Fallback if server is down
      const fallbackUser = JSON.parse(storedUser);
      set({ user: fallbackUser, isLoading: false });
    }
  },
}));