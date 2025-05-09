import { useEffect, useMemo, useRef, useState } from "react";
import { ServerResponse } from "@/lib/response";
import { ChatCommandMessage } from "@/lib/command";
import useChatContext from "@/useChatContext";
import MessageInput from "@/components/features/chat/MessageInput";
import { MessageBubble } from "@/components/features/chat/MessageBubble";

const CommandConsole = () => {
  const consoleBoxRef = useRef<HTMLDivElement>(null);
  const { client, isConnected } = useChatContext();
  const [isActive, setIsActive] = useState(false);
  const [limitMessageLength, setLimitMessageLength] = useState(true);

  const [consoleMessages, setConsoleMessages] = useState<
    (ServerResponse | ChatCommandMessage)[]
  >([]);

  useEffect(() => {
    if (!isConnected) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Backquote") {
        setIsActive((v) => !v);
      }
    };

    const currentClient = client.current;
    const updateMessages = (msg: ServerResponse) => {
      setConsoleMessages((prev) => [...prev, msg]);
    };
    currentClient?.on("message", updateMessages);

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      currentClient?.off("message", updateMessages);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [client, isConnected]);

  useEffect(() => {
    if (!consoleBoxRef.current) return;
    consoleBoxRef.current.scrollTop = consoleBoxRef.current?.scrollHeight + 200;
  }, [consoleMessages]);

  const handleCommandSubmit = async (input: string) => {
    if (input.trim()) {
      // TODO: handle error here
      await client.current?.sendChatCommandStr(input);
    }
  };

  const Messages = useMemo(
    () => (
      <>
        {consoleMessages.map((cmd, index) => {
          const sentCommand = client.current?.getCommandByCorrId(
            cmd.corrId ?? "",
          );
          return (
            <MessageBubble
              className="w-full"
              heading={`> ${sentCommand?.cmd || ""}`}
              key={`${index}-${cmd.corrId}`}
              limitMessageLenght={limitMessageLength}
            >
              {typeof (cmd as ChatCommandMessage).cmd === "string"
                ? `> ${(cmd as ChatCommandMessage).cmd}`
                : JSON.stringify(cmd)}
            </MessageBubble>
          );
        })}
      </>
    ),
    [limitMessageLength, client, consoleMessages],
  );

  return (
    <div
      className={`z-50 space-y-4 mb-4 absolute top-0 left-0 w-full bg-background p-4 ${
        isActive ? "opacity-100 visible" : "opacity-0 invisible"
      } transition-opacity duration-150 shadow-md`}
    >
      <div className="flex gap-4 justify-between">
        <h3>Console</h3>
        <div className="flex gap-2">
          <span className="border-r pr-2">Count: {consoleMessages.length}</span>
          <span>
            <label htmlFor="limitMessageLength">Limit message length</label>
            <input
              id="limitMessageLength"
              type="checkbox"
              defaultChecked
              onChange={(e) => setLimitMessageLength(e.target.checked)}
            ></input>
          </span>
        </div>
      </div>
      <div
        ref={consoleBoxRef}
        className="min-h-52 max-h-64 overflow-y-auto overflow-x-hidden bg-gray-800 p-2 rounded"
      >
        {Messages}
      </div>
      <MessageInput onSubmit={handleCommandSubmit} />
    </div>
  );
};

export default CommandConsole;
