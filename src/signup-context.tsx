import React, { createContext, useContext, useState } from "react";

export type SignupData = {
  userName: string;
  userId: string;
  userPw: string;
  phoneNumber: string;
  birthDate: string;
  email: string;
  gender: number | null;
  tall: string;
  weight: string;
  selectedStyles: string[];
  nickname: string;
  profileImage: null;
};

const initialData: SignupData = {
  userName: "",
  userId: "",
  userPw: "",
  phoneNumber: "",
  birthDate: "",
  email: "",
  gender: null,
  tall: "",
  weight: "",
  selectedStyles: [],
  nickname: "",
  profileImage: null,
};

type SignupContextType = {
  data: SignupData;
  updateData: (values: Partial<SignupData>) => void;
  resetData: () => void;
};

const SignupContext = createContext<SignupContextType | null>(null);

export function SignupProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SignupData>(initialData);

  const updateData = (values: Partial<SignupData>) => {
    setData((prev) => ({ ...prev, ...values }));
  };

  const resetData = () => setData(initialData);

  return (
    <SignupContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </SignupContext.Provider>
  );
}

export function useSignup() {
  const context = useContext(SignupContext);

  if (!context) {
    throw new Error("useSignup은 SignupProvider 내부에서 사용해야 합니다.");
  }

  return context;
}
