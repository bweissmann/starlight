import React, { useEffect, useRef, useState } from "react";
import { useAnimation, motion } from "framer-motion";

export const MAX_LINE_HEIGHT = "26px";

const Chunk: React.FC<{
  text: string;
  delayReady: boolean;
}> = ({ text, delayReady }) => {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      x: 0,
      y: 0,
      maxHeight: MAX_LINE_HEIGHT,
      transition: {
        x: { duration: 0.2 },
        y: { duration: 0.2 },
        maxHeight: { duration: 0.4 },
      },
    });
  }, [controls]);

  useEffect(() => {
    controls.start({
      opacity: delayReady ? 1 : 0.1,
      transition: {
        opacity: {
          duration: 0.4,
        },
      },
    });
  }, [controls, delayReady]);

  return (
    <>
      {text.split("\n").map((line, index, array) => (
        <>
          <motion.span
            ref={ref}
            style={{
              marginTop: "2px",
              marginBottom: "2px",
              fontSize: "22px",
              whiteSpace: "pre-wrap",
              overflowY: "visible",
              color: "black",
              transition: "color 0.3s ease",
            }}
            initial={{
              opacity: 0,
              x: 2,
              y: 0,
              minHeight: 0,
            }}
            animate={controls}
          >
            {line}
          </motion.span>
          {index < array.length - 1 && <span style={{ width: "100%" }} />}
        </>
      ))}
    </>
  );
};

export default Chunk;
