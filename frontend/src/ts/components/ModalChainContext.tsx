import {
  createContext,
  useContext,
  ParentProps,
  createSignal,
  JSXElement,
} from "solid-js";

type ModalChainItem = {
  id: string;
  show: () => void | Promise<void>;
  hide: () => void | Promise<void>;
  showOptions?: Record<string, unknown>;
};

type ModalChainContextValue = {
  pushModal: (item: ModalChainItem) => void;
  popModal: () => ModalChainItem | undefined;
  getPreviousModal: () => ModalChainItem | undefined;
  clearChain: () => void;
  getChainLength: () => number;
};

const ModalChainContext = createContext<ModalChainContextValue>();

export function ModalChainProvider(props: ParentProps): JSXElement {
  const [chain, setChain] = createSignal<ModalChainItem[]>([]);

  const pushModal = (item: ModalChainItem): void => {
    setChain((prev) => [...prev, item]);
  };

  const popModal = (): ModalChainItem | undefined => {
    const current = chain();
    if (current.length === 0) return undefined;

    const popped = current[current.length - 1];
    setChain(current.slice(0, -1));
    return popped;
  };

  const getPreviousModal = (): ModalChainItem | undefined => {
    const current = chain();
    return current.length > 0 ? current[current.length - 1] : undefined;
  };

  const clearChain = (): void => {
    setChain([]);
  };

  const getChainLength = (): number => {
    return chain().length;
  };

  return (
    <ModalChainContext.Provider
      value={{
        pushModal,
        popModal,
        getPreviousModal,
        clearChain,
        getChainLength,
      }}
    >
      {props.children}
    </ModalChainContext.Provider>
  );
}

export function useModalChain(): ModalChainContextValue | undefined {
  return useContext(ModalChainContext);
}
