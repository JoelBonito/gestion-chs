import React, { createContext, useContext, useState, ReactNode } from "react";

interface TopBarActionsContextType {
    actions: ReactNode | null;
    setActions: (actions: ReactNode | null) => void;
}

const TopBarActionsContext = createContext<TopBarActionsContextType | undefined>(undefined);

export const TopBarActionsProvider = ({ children }: { children: ReactNode }) => {
    const [actions, setActions] = useState<ReactNode | null>(null);

    return (
        <TopBarActionsContext.Provider value={{ actions, setActions }}>
            {children}
        </TopBarActionsContext.Provider>
    );
};

export const useTopBarActions = () => {
    const context = useContext(TopBarActionsContext);
    if (!context) {
        throw new Error("useTopBarActions must be used within a TopBarActionsProvider");
    }
    return context;
};
