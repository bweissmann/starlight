import React from "react";

const LLMChat = ({
  messageRaw,
}: {
  messageRaw: {
    spec: any;
    result: string;
    type: string;
    txId: string;
    txAncestry: string;
    price: string;
  };
}) => {
  const message = {
    ...messageRaw,
    txAncestry: JSON.parse(messageRaw.txAncestry) as string[],
  };
  return (
    <div style={{ marginLeft: "16px" }}>
      <details open>
        <summary>details</summary>
        <pre>
          <strong>Type:</strong> {message.type}
          <br />
          <strong>Task ID:</strong> {message.txId}
          <br />
          <strong>Task Ancestry:</strong> {message.txAncestry.join("///")}
          <br />
          <strong>Result:</strong> {message.result}
          <br />
          <strong>Spec:</strong> {message.spec}
          <br />
          <strong>Price:</strong> {message.price}
        </pre>
      </details>
    </div>
  );
};

export default LLMChat;
