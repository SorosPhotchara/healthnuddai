import { create } from "zustand";

interface User {
  title: string;
  identification_number: string;
  email: string;
  password?: string;
  fname: string;
  lname: string;
  sex: string;
  phone_number: string;
  role: string;
  birth_date: string;
  avatar_url?: string | null;
  dno?: number | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  set_user: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  load_user: () => Promise<void>;
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

        const updatedUser = { ...parsedUser, ...data.user };

        localStorage.setItem("user", JSON.stringify(updatedUser));
        set({ user: updatedUser, isLoading: false });
      } else {
        set({ user: parsedUser, isLoading: false });
      }
    } catch (error) {
      console.error("Auth Load Error:", error);
      const fallbackUser = JSON.parse(storedUser);
      set({ user: fallbackUser, isLoading: false });
    }
  },
}));