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
  // 상세 신체 정보 (선택, 7개 모두 입력하거나 모두 비워야 함)
  chestSize: string;
  waistSize: string;
  shoulderWidth: string;
  hips: string;
  thigh: string;
  calf: string;
  leg: string;
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
  chestSize: "",
  waistSize: "",
  shoulderWidth: "",
  hips: "",
  thigh: "",
  calf: "",
  leg: "",
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