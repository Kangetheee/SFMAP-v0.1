import { create } from "zustand";

type NewLoanState = {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
};

export const useNewLoan = create<NewLoanState>((set)=>({
    isOpen: false,
    onOpen: () => set({ isOpen: true}),
    onClose: () => set({ isOpen: false}),
}))