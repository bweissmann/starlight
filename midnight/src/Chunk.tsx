import React from "react";
import { motion } from "framer-motion";

export const keyFor = (log: any, index: number) => {
  return log.id + "*" + index;
};

const TextRenderer: React.FC<{
  log: any;
  keyToSectionMap: Map<string, number>;
  indexFromEnd: number;
  nSections: number;
}> = ({ log, indexFromEnd, keyToSectionMap, nSections }) => {
  const text = log.message.chunk as string;
  return (
    <>
      {text.split("\n").map((item, index, array) => {
        const sectionIndex = keyToSectionMap.get(keyFor(log, index)) as number;
        return (
          <React.Fragment key={index}>
            <Chunk
              sectionIndex={sectionIndex}
              text={item}
              indexFromEnd={indexFromEnd}
              nSections={nSections}
            />
            {index < array.length - 1 && <div style={{ width: "100%" }} />}
          </React.Fragment>
        );
      })}
    </>
  );
};

export const MAX_LINE_HEIGHT = "26px";
const Chunk: React.FC<{
  text: string;
  indexFromEnd: number;
  sectionIndex: number;
  nSections: number;
}> = ({ text, indexFromEnd, sectionIndex, nSections }) => {
  const colorInterpolation = 50 * (Math.min(indexFromEnd, 200) / 200) + 150;
  return (
    <motion.span
      style={{
        marginTop: "2px",
        marginBottom: "2px",
        fontSize: "22px",
        whiteSpace: "pre-wrap",
        overflowY: "visible",
        color:
          sectionIndex === nSections - 1
            ? "black"
            : `rgba(${colorInterpolation}, ${colorInterpolation}, ${colorInterpolation}, 1)`,
        transition: "color 0.3s ease",
      }}
      initial={{ opacity: 0, x: 3, y: 0, minHeight: 0 }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        maxHeight: MAX_LINE_HEIGHT,
      }}
      transition={{
        opacity: { duration: 0.3 },
        x: { duration: 0.3 },
        y: { duration: 0.3 },
        maxHeight: { duration: 0.4 },
      }}
    >
      {text}
    </motion.span>
  );
};

export default TextRenderer;
